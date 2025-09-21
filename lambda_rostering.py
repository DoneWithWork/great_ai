#!/usr/bin/env python3
"""
AWS Lambda compatible OR-Tools CP-SAT nurse rostering for 7 days x 2 shifts/day.
Entrypoint: lambda_handler(event, context)

Expected event JSON:
{
  "nurse_profiles": [
    {"nurse_id":"n001","preferred_days_off":[0,6],"preferred_shift_type":0},
    ...
  ],
  "N": 4,           # nurses required per day
  "max_seconds": 20 # optional solver time limit
}

Output JSON (returned by handler):
{
  "Sunday": {"day_shift":["n001","n002"], "night_shift":["n003","n004"]},
  "Monday": {...}, ...
}
"""
from ortools.sat.python import cp_model
import json
from typing import List, Dict

DAYS = list(range(7))
DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

# Model choices: day = 8h, night = 12h (allows combos to meet 40-45 & 4-5 shifts)
SHIFTS = ["day","night"]
SHIFT_HOURS = {"day": 8, "night": 12}

# Hard constraint bounds
MIN_WEEK_HOURS = 40
MAX_WEEK_HOURS = 45
MIN_SHIFTS_PER_WEEK = 4
MAX_SHIFTS_PER_WEEK = 5

# Soft constraint weights (tune these)
PENALTY_DAYOFF = 100  # large penalty for assigning on preferred day off
REWARD_PREF_SHIFT = -10  # reward (negative penalty) for assigning preferred shift type
PENALTY_UNASSIGNED = 200  # penalty if demand cannot be met (slack)

def build_and_solve(nurse_profiles: List[Dict], N: int, time_limit: int = 20):
    """
    Build CP model and solve. Returns roster mapping day->shifts->list of nurse_ids.
    """
    # Preprocess nurses
    nurses = [n["nurse_id"] for n in nurse_profiles]
    pref_days_off = {n["nurse_id"]: set(n.get("preferred_days_off", [])) for n in nurse_profiles}
    pref_shift = {n["nurse_id"]: int(n.get("preferred_shift_type", 0)) for n in nurse_profiles}

    # Demand per day: split N equally between day and night
    night_req = N // 2
    day_req = N - night_req  # day gets extra if N odd

    # Model
    model = cp_model.CpModel()

    # Decision variables: assign[(nurse, day, shift)]
    assign = {}
    for nid in nurses:
        for d in DAYS:
            for s in SHIFTS:
                assign[(nid, d, s)] = model.NewBoolVar(f"x_{nid}_{d}_{s}")

    # Hard: at most one shift per nurse per day
    for nid in nurses:
        for d in DAYS:
            model.Add(sum(assign[(nid, d, s)] for s in SHIFTS) <= 1)

    # Hard: weekly hours between MIN_WEEK_HOURS and MAX_WEEK_HOURS
    nurse_hours = {}
    for nid in nurses:
        total_hours_expr = sum(assign[(nid, d, s)] * SHIFT_HOURS[s] for d in DAYS for s in SHIFTS)
        # integer variable to track hours
        hvar = model.NewIntVar(0, MAX_WEEK_HOURS, f"hours_{nid}")
        model.Add(hvar == total_hours_expr)
        model.Add(hvar >= MIN_WEEK_HOURS)
        model.Add(hvar <= MAX_WEEK_HOURS)
        nurse_hours[nid] = hvar

    # Hard: number of shifts per nurse between MIN_SHIFTS_PER_WEEK and MAX_SHIFTS_PER_WEEK
    for nid in nurses:
        total_shifts_expr = sum(assign[(nid, d, s)] for d in DAYS for s in SHIFTS)
        s_var = model.NewIntVar(0, MAX_SHIFTS_PER_WEEK, f"shifts_{nid}")
        model.Add(s_var == total_shifts_expr)
        model.Add(s_var >= MIN_SHIFTS_PER_WEEK)
        model.Add(s_var <= MAX_SHIFTS_PER_WEEK)

    # Hard: forbid night -> day on next day (no quick turnaround)
    # If nurse works night on day d, cannot work day on day d+1
    for nid in nurses:
        for d in range(6):
            model.Add(assign[(nid, d, "night")] + assign[(nid, d + 1, "day")] <= 1)

    # Staffing demand per day/shift (hard as possible; allow slack with heavy penalty)
    # Create slack vars if exact coverage impossible
    slack_vars = {}
    for d in DAYS:
        # day
        day_quals = [assign[(n, d, "day")] for n in nurses]
        slack_day = model.NewIntVar(0, len(nurses), f"slack_day_{d}")
        slack_vars[("day", d)] = slack_day
        model.Add(sum(day_quals) + slack_day >= day_req)

        # night
        night_quals = [assign[(n, d, "night")] for n in nurses]
        slack_night = model.NewIntVar(0, len(nurses), f"slack_night_{d}")
        slack_vars[("night", d)] = slack_night
        model.Add(sum(night_quals) + slack_night >= night_req)

    # Objective: minimize penalties (day-off violations, slack, prefer shift types)
    obj_terms = []

    # Penalty for assigning on preferred days off
    for nid in nurses:
        for d in DAYS:
            if d in pref_days_off.get(nid, set()):
                for s in SHIFTS:
                    obj_terms.append(assign[(nid, d, s)] * PENALTY_DAYOFF)

    # Reward for assigning preferred shift type
    for nid in nurses:
        preferred = pref_shift.get(nid, 0)  # 0=day,1=night
        for d in DAYS:
            if preferred == 0:
                obj_terms.append(assign[(nid, d, "day")] * REWARD_PREF_SHIFT)
            else:
                obj_terms.append(assign[(nid, d, "night")] * REWARD_PREF_SHIFT)

    # Penalize slack heavily (uncovered positions)
    for key, sval in slack_vars.items():
        obj_terms.append(sval * PENALTY_UNASSIGNED)

    model.Minimize(sum(obj_terms))

    # Solve
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = max(1, int(time_limit))
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {"error": "No feasible solution found", "status": solver.StatusName(status)}

    # Build roster output: day_name -> {day_shift: [...], night_shift: [...]}
    roster = {DAY_NAMES[d]: {"day_shift": [], "night_shift": []} for d in DAYS}

    for d in DAYS:
        for nid in nurses:
            if solver.BooleanValue(assign[(nid, d, "day")]):
                roster[DAY_NAMES[d]]["day_shift"].append(nid)
            if solver.BooleanValue(assign[(nid, d, "night")]):
                roster[DAY_NAMES[d]]["night_shift"].append(nid)

    # Provide some diagnostics
    nurse_hours_out = {nid: int(solver.Value(nurse_hours[nid])) for nid in nurses}
    slack_out = {f"{k[0]}_{k[1]}": int(solver.Value(v)) for k, v in slack_vars.items()}

    return {
        "roster": roster,
        "nurse_hours": nurse_hours_out,
        "slack": slack_out,
        "objective": solver.ObjectiveValue(),
        "status": solver.StatusName(status)
    }

# AWS Lambda handler
def lambda_handler(event, context):
    """
    Lambda event format:
    {
      "nurse_profiles": [ {"nurse_id":"n001","preferred_days_off":[0,6],"preferred_shift_type":0}, ... ],
      "N": 4,
      "max_seconds": 20
    }
    If event is empty or missing keys, run a built-in example.
    """
    try:
        nurse_profiles = event.get("nurse_profiles") if event and isinstance(event, dict) else None
        N = int(event.get("N")) if event and isinstance(event, dict) and event.get("N") is not None else None
        time_limit = int(event.get("max_seconds")) if event and event.get("max_seconds") else 20
    except Exception as e:
        return {"error": f"Invalid event format: {e}"}

    # Example fallback if not provided
    if not nurse_profiles or N is None:
        # small example: 5 nurses, N=4 (2 per shift)
        nurse_profiles = [
            {"nurse_id": "n001", "preferred_days_off": [0,6], "preferred_shift_type": 0},
            {"nurse_id": "n002", "preferred_days_off": [1,2], "preferred_shift_type": 0},
            {"nurse_id": "n003", "preferred_days_off": [3,4], "preferred_shift_type": 1},
            {"nurse_id": "n004", "preferred_days_off": [5,6], "preferred_shift_type": 1},
            {"nurse_id": "n005", "preferred_days_off": [2,3], "preferred_shift_type": 0}
        ]
        N = 4
        time_limit = 10

    result = build_and_solve(nurse_profiles, N, time_limit=time_limit)
    # Print JSON (Lambda logs)
    print(json.dumps(result, indent=2))
    # Return JSON
    return result

# For local testing
if __name__ == "__main__":
    print("Local test run (example)...")
    res = lambda_handler({}, None)
    print(json.dumps(res, indent=2))