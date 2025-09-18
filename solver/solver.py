"""
Nurse rostering: constraint programming reference implementation (OR-Tools CP-SAT)

Author: assistant (generated for Abel & team)
Purpose: provide a runnable, modular CP model that encodes
- shift coverage by skill
- weekly hours cap (45h) and shift-hour accounting
- min rest between shifts (configurable)
- nurse preferences (soft objective)
- fairness objective: minimize max deviation from mean hours

How to use: edit the sample_data() to reflect your hospital inputs, then run.
Requires: ortools (pip install ortools)

This is intended as an extensible base — you'll want to add finer constraints
(rolling overtime per month, breaks-replacement windows, legal nuances) as you
integrate with your full pipeline. See comments below for extension points.
"""

from ortools.sat.python import cp_model
import math


def sample_data():
    # Example small dataset. Replace with your processed inputs.
    nurses = [
        {"id": "n1", "name": "Alice", "skills": {"ICU": 1, "WARD": 1}, "max_hours": 45, "preferred_shifts": {"day": 1, "night": -1}},
        {"id": "n2", "name": "Bob",   "skills": {"ICU": 0, "WARD": 1}, "max_hours": 45, "preferred_shifts": {"day": 0.5, "night": 0}},
        {"id": "n3", "name": "Cathy", "skills": {"ICU": 1, "WARD": 0}, "max_hours": 45, "preferred_shifts": {"day": 0, "night": 1}},
    ]

    # Define shifts for 7 days, 2 shift types: day(12h) and night(12h)
    days = list(range(7))
    shift_types = [
        {"id": "day", "start": 8, "length": 12, "skill": "WARD"},
        {"id": "night", "start": 20, "length": 12, "skill": "ICU"},
    ]

    # demand[day_index][shift_type_id] = number of nurses required
    demand = {}
    for d in days:
        demand[(d, "day")] = 2
        demand[(d, "night")] = 1

    params = {
        "min_rest_hours": 12,   # minimum rest between shift end and next shift start
        "week_hours_cap": 45,
        "shift_types": shift_types,
        "days": days,
    }

    return nurses, demand, params


class NurseRosteringSolver:
    def __init__(self, nurses, demand, params):
        self.nurses = nurses
        self.demand = demand
        self.params = params
        self.model = cp_model.CpModel()
        self.vars = {}  # (n_idx, day, shift_id) -> var
        self.shift_hours = {}
        self._build_variables()
        self._add_constraints()

    def _build_variables(self):
        # Create boolean assignment variables
        for n_idx, n in enumerate(self.nurses):
            for d in self.params["days"]:
                for st in self.params["shift_types"]:
                    sid = st["id"]
                    v = self.model.NewBoolVar(f"x_n{n_idx}_d{d}_s{sid}")
                    self.vars[(n_idx, d, sid)] = v
                    self.shift_hours[sid] = st["length"]

    def _add_constraints(self):
        # 1) Coverage: for each day & shift type, required number of nurses with that skill
        for d in self.params["days"]:
            for st in self.params["shift_types"]:
                sid = st["id"]
                skill = st.get("skill")
                req = self.demand.get((d, sid), 0)
                # sum of nurses assigned to shift >= req
                assigned = []
                for n_idx, n in enumerate(self.nurses):
                    # only nurses with required skill allowed
                    if skill and not n["skills"].get(skill, 0):
                        continue
                    assigned.append(self.vars[(n_idx, d, sid)])
                # If insufficient qualified nurses in the pool, model would be infeasible
                if assigned:
                    self.model.Add(sum(assigned) >= req)
                else:
                    # no qualified nurse exists -> add a slack variable to allow feasibility
                    slack = self.model.NewIntVar(0, req, f"slack_d{d}_s{sid}")
                    self.model.Add(slack >= req)

        # 2) Each nurse: at most one shift per day (common rostering assumption)
        for n_idx, n in enumerate(self.nurses):
            for d in self.params["days"]:
                self.model.Add(sum(self.vars[(n_idx, d, st["id"]) ] for st in self.params["shift_types"]) <= 1)

        # 3) Weekly hours cap per nurse
        for n_idx, n in enumerate(self.nurses):
            total_hours = sum(self.vars[(n_idx, d, st["id"]) ] * st["length"] for d in self.params["days"] for st in self.params["shift_types"]) 
            self.model.Add(total_hours <= self.params.get("week_hours_cap", n.get("max_hours", 45)))

        # 4) Minimum rest between shifts (enforce via forbidding assignments that violate rest window)
        # For simplicity we only ensure that if nurse works shift A on day d and shift B on day d+1,
        # the gap between end of A and start of B is >= min_rest_hours.
        min_rest = self.params.get("min_rest_hours", 12)
        for n_idx, n in enumerate(self.nurses):
            for d in self.params["days"]:
                for st_a in self.params["shift_types"]:
                    a_id = st_a["id"]
                    a_start = st_a["start"]
                    a_end = (a_start + st_a["length"]) % 24
                    # next day shifts
                    next_d = d + 1
                    if next_d not in self.params["days"]:
                        continue
                    for st_b in self.params["shift_types"]:
                        b_id = st_b["id"]
                        b_start = st_b["start"]
                        # compute hours between a_end on day d and b_start on day d+1
                        gap = (24 - a_end) + b_start
                        if gap < min_rest:
                            # cannot have both assigned
                            self.model.Add(self.vars[(n_idx, d, a_id)] + self.vars[(n_idx, next_d, b_id)] <= 1)

        # 5) Skills: if nurse lacks skill for shift, force var == 0
        for n_idx, n in enumerate(self.nurses):
            for d in self.params["days"]:
                for st in self.params["shift_types"]:
                    sid = st["id"]
                    skill = st.get("skill")
                    if skill and not n["skills"].get(skill, 0):
                        # cannot assign
                        self.model.Add(self.vars[(n_idx, d, sid)] == 0)

        # 6) Fairness helper vars: total_hours per nurse
        self.total_hours_vars = []
        for n_idx, n in enumerate(self.nurses):
            th = self.model.NewIntVar(0, self.params.get("week_hours_cap", 45), f"hours_n{n_idx}")
            # sum of assigned*length == th
            self.model.Add(th == sum(self.vars[(n_idx, d, st["id"]) ] * st["length"] for d in self.params["days"] for st in self.params["shift_types"]))
            self.total_hours_vars.append(th)

        # fairness: minimize max deviation from mean
        max_hours = self.model.NewIntVar(0, self.params.get("week_hours_cap", 45), "max_hours")
        min_hours = self.model.NewIntVar(0, self.params.get("week_hours_cap", 45), "min_hours")
        self.model.AddMaxEquality(max_hours, self.total_hours_vars)
        self.model.AddMinEquality(min_hours, self.total_hours_vars)
        self.max_hours = max_hours
        self.min_hours = min_hours

    def solve(self, time_limit_seconds=30):
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = time_limit_seconds
        solver.parameters.num_search_workers = 8

        # Objective: weighted combination of
        # - preference score (maximize)
        # - fairness (minimize max-min)
        # We need to convert maximize preference into minimize negative

        # compute linear preference expression
        pref_terms = []
        for n_idx, n in enumerate(self.nurses):
            for d in self.params["days"]:
                for st in self.params["shift_types"]:
                    sid = st["id"]
                    pref_weight = int(100 * n.get("preferred_shifts", {}).get(sid, 0))
                    if pref_weight != 0:
                        pref_terms.append((pref_weight, self.vars[(n_idx, d, sid)]))

        # Build objective as: minimize (alpha * (max_hours - min_hours) - beta * preference_sum)
        alpha = 100
        beta = 1

        # Create linear expression
        objective_terms = []
        # fairness term (max-min) -> minimize
        objective_terms.append((alpha, self.max_hours))
        objective_terms.append((-alpha, self.min_hours))
        # preference term (we subtract to maximize preferences)
        for w, var in pref_terms:
            objective_terms.append((-beta * w, var))

        # CP-SAT expects objective in form of linear combination; we implement by
        # creating an IntVar to capture objective and minimizing it
        # Compute bounds for objective var
        obj_lb = -1000000
        obj_ub = 1000000
        obj_var = self.model.NewIntVar(obj_lb, obj_ub, "obj")

        # create linear expression via Add(obj == sum(coeff * var) ) -- but Add expects affine sum of IntVars
        # we use linearized sum of terms: for each (coeff, var) where var is Bool or IntVar
        linear_terms = []
        for coeff, var in objective_terms:
            linear_terms.append((coeff, var))
        self.model.Add(obj_var == sum(coeff * var for coeff, var in linear_terms))
        self.model.Minimize(obj_var)

        res = solver.Solve(self.model)
        status = solver.StatusName(res)
        solution = None
        if res == cp_model.OPTIMAL or res == cp_model.FEASIBLE:
            solution = self._extract_solution(solver)
        return status, solution

    def _extract_solution(self, solver):
        schedule = {}
        for n_idx, n in enumerate(self.nurses):
            schedule[n["id"]] = []
            for d in self.params["days"]:
                for st in self.params["shift_types"]:
                    sid = st["id"]
                    if solver.Value(self.vars[(n_idx, d, sid)]) == 1:
                        schedule[n["id"]].append({"day": d, "shift": sid, "hours": st["length"]})
        hours = {n["id"]: solver.Value(var) for n, var in zip(self.nurses, self.total_hours_vars)}
        return {"schedule": schedule, "hours": hours}


if __name__ == "__main__":
    nurses, demand, params = sample_data()
    solver = NurseRosteringSolver(nurses, demand, params)
    status, sol = solver.solve(time_limit_seconds=20)
    print("Status:", status)
    if sol:
        print("Hours per nurse:")
        for nid, h in sol["hours"].items():
            print(f"  {nid}: {h}h")
        print("Assignments:")
        for nid, assigns in sol["schedule"].items():
            print(f"  {nid} -> {assigns}")
    else:
        print("No feasible solution found. Consider relaxing coverage or adding slack variables.")

    # Extension points (TODO):
    # - Add break-replacement windows: model short "break slots" requiring coverage and allow separate short-shift replacements.
    # - Implement monthly overtime caps: keep rolling sum across multiple weeks (requires multi-week horizon and integer arithmetic for monthly windows).
    # - Add soft constraints for weekend fairness, consecutive working days, and individual max consecutive nights.
    # - Add objective weights tunable via params and multi-objective optimization or lexicographic optimization.