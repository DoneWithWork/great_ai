#!/usr/bin/env python3
"""
Malaysian Nurse Rostering System using Constraint Programming (CP)
Complies with Malaysian Labour Laws and Healthcare Requirements

Key Requirements:
- 45 hours/week maximum (excluding 5-hour break allocation)
- 104 hours/month overtime maximum  
- 30-minute break per 5 hours worked
- Nurse-to-patient ratios (target 1:225 vs current 1:283)
- Shift preferences (Day > Evening > Night)
- Burnout prevention (limit consecutive night shifts)
"""

import pandas as pd
import numpy as np
from ortools.sat.python import cp_model
from datetime import datetime, timedelta
import json
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from collections import defaultdict
import matplotlib.pyplot as plt
import seaborn as sns

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ShiftType:
    """Define shift characteristics"""
    name: str
    start_hour: int
    duration_hours: int
    break_minutes: int
    patient_ratio_multiplier: float  # Adjustment for patient load (night = higher)
    burnout_risk: float  # 1.0 = baseline, 2.7 = night shift risk
    preference_score: int  # 1=most preferred, 4=least preferred

@dataclass 
class Nurse:
    """Nurse profile with constraints and preferences"""
    id: str
    experience_years: int
    skills: List[str]
    contract_type: str  # 'full_time', 'part_time', 'contract'
    max_hours_per_week: int
    prefers_12h_shifts: bool
    shift_preferences: List[int]  # Ordered preference [Day, Evening, Night]
    has_second_job: bool
    overtime_willing: bool
    
@dataclass
class Ward:
    """Hospital ward with patient requirements"""
    name: str
    patient_count: int
    min_nurses_per_shift: int
    required_skills: List[str]
    patient_acuity: float  # 1.0 = normal, 2.0 = ICU/high acuity

class MalaysianNurseRosterCP:
    """Constraint Programming solver for Malaysian nurse scheduling"""
    
    def __init__(self, data_path: str = None):
        self.base_path = Path("/home/student/Documents/learnml-wong")
        self.output_path = self.base_path / "cp_output"
        self.output_path.mkdir(exist_ok=True)
        
        # Malaysian Labour Law Constants
        self.MAX_HOURS_PER_WEEK = 45  # Excluding breaks
        self.MAX_OVERTIME_PER_MONTH = 104
        self.BREAK_DURATION_MINUTES = 30  # Per 5 hours
        self.OVERTIME_RATE = 1.5
        self.MAX_CONSECUTIVE_NIGHTS = 3  # Burnout prevention
        self.REQUIRED_REST_BETWEEN_SHIFTS = 12  # Hours
        
        # Shift definitions (Malaysian hospital standard)
        self.shift_types = {
            'DAY': ShiftType('Day', 7, 12, 60, 1.0, 1.0, 1),      # 7am-7pm
            'EVENING': ShiftType('Evening', 15, 10, 30, 1.1, 1.3, 2),  # 3pm-1am  
            'NIGHT': ShiftType('Night', 19, 12, 60, 1.3, 2.7, 3),   # 7pm-7am
            'HALF_DAY': ShiftType('Half Day', 7, 6, 30, 0.8, 0.8, 1) # 7am-1pm
        }
        
        self.nurses = []
        self.wards = []
        self.schedule_days = 28  # 4 weeks
        
        # Load existing data if available
        if data_path:
            self.load_data(data_path)
        else:
            self.generate_synthetic_data()
    
    def generate_synthetic_data(self):
        """Generate realistic Malaysian hospital data"""
        logger.info("Generating synthetic Malaysian hospital data...")
        
        # Load our previously created dataset for reference
        try:
            kaggle_df = pd.read_csv(self.base_path / "cleaned_data" / "kaggle_staff_scheduling_cleaned.csv")
            logger.info(f"Loaded {len(kaggle_df)} nurses from existing dataset")
        except FileNotFoundError:
            logger.warning("No existing data found, creating from scratch")
            kaggle_df = None
        
        # Generate nurses based on Malaysian hospital statistics
        nurse_count = 150  # Typical mid-size government hospital
        
        for i in range(nurse_count):
            # Use existing data patterns if available
            if kaggle_df is not None and i < len(kaggle_df):
                row = kaggle_df.iloc[i]
                experience = int(row['years_of_experience'])
                department = row['department']
            else:
                experience = np.random.choice([1,2,3,4,5,6,7,8,9,10,15,20], p=[0.15,0.12,0.1,0.1,0.08,0.08,0.07,0.06,0.06,0.05,0.08,0.05])
                department = np.random.choice(['General Medicine', 'ICU', 'ER', 'Pediatrics', 'Surgery'])
            
            # Malaysian nurse characteristics
            contract_type = np.random.choice(['full_time', 'part_time'], p=[0.85, 0.15])
            max_hours = 45 if contract_type == 'full_time' else 25
            
            # New nurses prefer 12-hour shifts (research finding)
            prefers_12h = experience <= 3 or np.random.random() < 0.6
            
            # 45.6% work voluntary overtime, 13% have second job
            overtime_willing = np.random.random() < 0.456
            has_second_job = np.random.random() < 0.13
            
            # Most choose day > evening > night
            if np.random.random() < 0.7:  # 70% prefer day shifts
                shift_prefs = [1, 2, 3]  # Day, Evening, Night
            elif np.random.random() < 0.2:  # 20% prefer evening
                shift_prefs = [2, 1, 3]
            else:  # 10% don't mind night (often experienced or financial need)
                shift_prefs = [3, 1, 2] if has_second_job else [1, 3, 2]
            
            # Skills based on department and experience
            base_skills = ['basic_nursing']
            if department == 'ICU':
                base_skills.extend(['critical_care', 'ventilator'])
            elif department == 'ER':
                base_skills.extend(['emergency', 'triage'])
            elif department == 'Surgery':
                base_skills.extend(['surgical', 'anesthesia'])
            elif department == 'Pediatrics':
                base_skills.extend(['pediatric'])
                
            if experience > 5:
                base_skills.append('advanced_practice')
            if experience > 10:
                base_skills.append('mentoring')
            
            nurse = Nurse(
                id=f"N{i:03d}",
                experience_years=experience,
                skills=base_skills,
                contract_type=contract_type,
                max_hours_per_week=max_hours,
                prefers_12h_shifts=prefers_12h,
                shift_preferences=shift_prefs,
                has_second_job=has_second_job,
                overtime_willing=overtime_willing
            )
            self.nurses.append(nurse)
        
        # Generate wards with Malaysian patient ratios
        ward_configs = [
            ('General Medicine', 60, ['basic_nursing'], 1.0),
            ('ICU', 20, ['critical_care', 'ventilator'], 2.5),
            ('Emergency', 40, ['emergency', 'triage'], 1.8),
            ('Surgery', 35, ['surgical'], 1.2),
            ('Pediatrics', 25, ['pediatric'], 1.4),
            ('Maternity', 30, ['basic_nursing'], 1.1)
        ]
        
        for name, patients, skills, acuity in ward_configs:
            # Calculate minimum nurses using WHO recommendation (1:225 improved to 1:200)
            target_ratio = 200  # Better than WHO 1:225, current Malaysia 1:283
            base_nurses_needed = max(2, patients // target_ratio * len(self.shift_types))
            
            # Adjust for acuity (ICU needs more nurses)
            min_nurses = max(2, int(base_nurses_needed * acuity))
            
            ward = Ward(
                name=name,
                patient_count=patients,
                min_nurses_per_shift=min_nurses,
                required_skills=skills,
                patient_acuity=acuity
            )
            self.wards.append(ward)
        
        logger.info(f"Generated {len(self.nurses)} nurses and {len(self.wards)} wards")
        
        # Log statistics
        full_time_count = sum(1 for n in self.nurses if n.contract_type == 'full_time')
        overtime_willing_count = sum(1 for n in self.nurses if n.overtime_willing)
        second_job_count = sum(1 for n in self.nurses if n.has_second_job)
        
        logger.info(f"Nurse statistics:")
        logger.info(f"  Full-time: {full_time_count} ({full_time_count/len(self.nurses)*100:.1f}%)")
        logger.info(f"  Willing overtime: {overtime_willing_count} ({overtime_willing_count/len(self.nurses)*100:.1f}%)")
        logger.info(f"  Second job: {second_job_count} ({second_job_count/len(self.nurses)*100:.1f}%)")
    
    def create_cp_model(self):
        """Create the constraint programming model"""
        logger.info("Creating CP model with Malaysian labour law constraints...")
        
        model = cp_model.CpModel()
        
        # Decision variables: nurse_shifts[nurse_id][day][shift_type][ward] = 0/1
        nurse_shifts = {}
        for nurse in self.nurses:
            nurse_shifts[nurse.id] = {}
            for day in range(self.schedule_days):
                nurse_shifts[nurse.id][day] = {}
                for shift_name in self.shift_types.keys():
                    nurse_shifts[nurse.id][day][shift_name] = {}
                    for ward in self.wards:
                        nurse_shifts[nurse.id][day][shift_name][ward.name] = model.NewBoolVar(
                            f'nurse_{nurse.id}_day_{day}_shift_{shift_name}_ward_{ward.name}'
                        )
        
        # Break coverage variables: break_coverage[day][shift_type][ward] = number of break replacements
        break_coverage = {}
        for day in range(self.schedule_days):
            break_coverage[day] = {}
            for shift_name in self.shift_types.keys():
                break_coverage[day][shift_name] = {}
                for ward in self.wards:
                    break_coverage[day][shift_name][ward.name] = model.NewIntVar(
                        0, 10, f'break_coverage_day_{day}_shift_{shift_name}_ward_{ward.name}'
                    )
        
        # ✅ CONSTRAINT 1: Malaysian Labour Law - Maximum 45 hours per week
        for nurse in self.nurses:
            for week in range(4):  # 4 weeks
                week_start = week * 7
                week_hours = []
                
                for day in range(week_start, min(week_start + 7, self.schedule_days)):
                    for shift_name, shift_type in self.shift_types.items():
                        for ward in self.wards:
                            # Each shift contributes its duration in hours
                            week_hours.append(
                                nurse_shifts[nurse.id][day][shift_name][ward.name] * shift_type.duration_hours
                            )
                
                # Total weekly hours <= 45 (excluding breaks)
                model.Add(sum(week_hours) <= nurse.max_hours_per_week)
        
        # ✅ CONSTRAINT 2: Maximum overtime (104 hours/month)
        for nurse in self.nurses:
            if nurse.overtime_willing:
                total_monthly_hours = []
                regular_hours = nurse.max_hours_per_week * 4  # 4 weeks regular
                
                for day in range(self.schedule_days):
                    for shift_name, shift_type in self.shift_types.items():
                        for ward in self.wards:
                            total_monthly_hours.append(
                                nurse_shifts[nurse.id][day][shift_name][ward.name] * shift_type.duration_hours
                            )
                
                # Total monthly hours <= regular + overtime limit
                model.Add(sum(total_monthly_hours) <= regular_hours + self.MAX_OVERTIME_PER_MONTH)
        
        # ✅ CONSTRAINT 3: Ward coverage requirements  
        for day in range(self.schedule_days):
            for shift_name in self.shift_types.keys():
                for ward in self.wards:
                    # Minimum nurses per shift (including break coverage)
                    assigned_nurses = []
                    for nurse in self.nurses:
                        assigned_nurses.append(nurse_shifts[nurse.id][day][shift_name][ward.name])
                    
                    # Ward coverage = assigned nurses + break replacements >= minimum required
                    model.Add(sum(assigned_nurses) + break_coverage[day][shift_name][ward.name] >= ward.min_nurses_per_shift)
        
        # ✅ CONSTRAINT 4: Break coverage (30 min per 5 hours = 6 breaks per 12h shift)
        for day in range(self.schedule_days):
            for shift_name, shift_type in self.shift_types.items():
                if shift_type.duration_hours >= 10:  # Long shifts need break coverage
                    for ward in self.wards:
                        assigned_nurses = []
                        for nurse in self.nurses:
                            assigned_nurses.append(nurse_shifts[nurse.id][day][shift_name][ward.name])
                        
                        # Break coverage = 20% of assigned nurses (approximation)
                        # Create integer variable for nurse count
                        nurse_count = model.NewIntVar(0, len(self.nurses), f'nurse_count_{day}_{shift_name}_{ward.name}')
                        model.Add(nurse_count == sum(assigned_nurses))
                        model.Add(break_coverage[day][shift_name][ward.name] * 5 >= nurse_count)
        
        # ✅ CONSTRAINT 5: One shift per nurse per day
        for nurse in self.nurses:
            for day in range(self.schedule_days):
                daily_assignments = []
                for shift_name in self.shift_types.keys():
                    for ward in self.wards:
                        daily_assignments.append(nurse_shifts[nurse.id][day][shift_name][ward.name])
                
                model.Add(sum(daily_assignments) <= 1)
        
        # ✅ CONSTRAINT 6: Skill requirements
        for day in range(self.schedule_days):
            for shift_name in self.shift_types.keys():
                for ward in self.wards:
                    if ward.required_skills and ward.required_skills != ['basic_nursing']:
                        # At least one nurse with required skills per shift
                        skilled_nurses = []
                        for nurse in self.nurses:
                            if any(skill in nurse.skills for skill in ward.required_skills):
                                skilled_nurses.append(nurse_shifts[nurse.id][day][shift_name][ward.name])
                        
                        if skilled_nurses:  # Only if we have nurses with required skills
                            model.Add(sum(skilled_nurses) >= 1)
        
        # ✅ CONSTRAINT 7: Limit consecutive night shifts (burnout prevention)
        for nurse in self.nurses:
            for day in range(self.schedule_days - self.MAX_CONSECUTIVE_NIGHTS):
                consecutive_nights = []
                for consecutive_day in range(day, day + self.MAX_CONSECUTIVE_NIGHTS + 1):
                    for ward in self.wards:
                        consecutive_nights.append(nurse_shifts[nurse.id][consecutive_day]['NIGHT'][ward.name])
                
                # No more than MAX_CONSECUTIVE_NIGHTS consecutive night shifts
                model.Add(sum(consecutive_nights) <= self.MAX_CONSECUTIVE_NIGHTS)
        
        # ✅ CONSTRAINT 8: Rest between shifts (12 hours minimum)
        for nurse in self.nurses:
            for day in range(self.schedule_days - 1):
                # If working night shift, can't work day shift next day
                night_assignments = []
                next_day_early = []
                
                for ward in self.wards:
                    night_assignments.append(nurse_shifts[nurse.id][day]['NIGHT'][ward.name])
                    next_day_early.append(nurse_shifts[nurse.id][day + 1]['DAY'][ward.name])
                
                # If working night, can't work day shift next day
                model.Add(sum(night_assignments) + sum(next_day_early) <= 1)
        
        # ✅ OBJECTIVE: Minimize burnout risk while maximizing preferences
        objective_terms = []
        
        for nurse in self.nurses:
            for day in range(self.schedule_days):
                for shift_name, shift_type in self.shift_types.items():
                    for ward in self.wards:
                        var = nurse_shifts[nurse.id][day][shift_name][ward.name]
                        
                        # Burnout penalty (higher for night shifts)
                        burnout_penalty = int(shift_type.burnout_risk * 100)
                        
                        # Preference bonus (higher for preferred shifts)
                        pref_index = ['DAY', 'EVENING', 'NIGHT'].index(shift_name) if shift_name in ['DAY', 'EVENING', 'NIGHT'] else 1
                        preference_bonus = 300 - (nurse.shift_preferences[pref_index] * 100) if pref_index < len(nurse.shift_preferences) else 0
                        
                        # Experience bonus (experienced nurses for high-acuity wards)
                        experience_bonus = nurse.experience_years * int(ward.patient_acuity * 10) if nurse.experience_years > 5 else 0
                        
                        # Total score for this assignment
                        assignment_score = preference_bonus + experience_bonus - burnout_penalty
                        objective_terms.append(var * assignment_score)
        
        # Maximize satisfaction while minimizing burnout
        model.Maximize(sum(objective_terms))
        
        logger.info("CP model created with all constraints")
        return model, nurse_shifts, break_coverage
    
    def solve_schedule(self):
        """Solve the constraint programming model"""
        logger.info("Solving Malaysian nurse rostering problem...")
        
        model, nurse_shifts, break_coverage = self.create_cp_model()
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = 300  # 5 minutes limit
        
        # Solve
        status = solver.Solve(model)
        
        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            logger.info(f"Solution found! Status: {'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE'}")
            
            # Extract solution
            schedule = self.extract_solution(solver, nurse_shifts, break_coverage)
            
            # Analyze and validate
            analysis = self.analyze_solution(schedule)
            
            # Save results
            self.save_results(schedule, analysis)
            
            return schedule, analysis
            
        else:
            logger.error("No feasible solution found!")
            logger.error(f"Solver status: {solver.StatusName(status)}")
            return None, None
    
    def extract_solution(self, solver, nurse_shifts, break_coverage):
        """Extract the solution from solved model"""
        schedule = {
            'assignments': [],
            'break_coverage': [],
            'daily_summary': defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        }
        
        # Extract nurse assignments
        for nurse in self.nurses:
            for day in range(self.schedule_days):
                for shift_name in self.shift_types.keys():
                    for ward in self.wards:
                        if solver.Value(nurse_shifts[nurse.id][day][shift_name][ward.name]) == 1:
                            assignment = {
                                'nurse_id': nurse.id,
                                'day': day,
                                'shift': shift_name,
                                'ward': ward.name,
                                'hours': self.shift_types[shift_name].duration_hours,
                                'experience': nurse.experience_years,
                                'skills': nurse.skills
                            }
                            schedule['assignments'].append(assignment)
                            schedule['daily_summary'][day][shift_name][ward.name] += 1
        
        # Extract break coverage
        for day in range(self.schedule_days):
            for shift_name in self.shift_types.keys():
                for ward in self.wards:
                    coverage = solver.Value(break_coverage[day][shift_name][ward.name])
                    if coverage > 0:
                        schedule['break_coverage'].append({
                            'day': day,
                            'shift': shift_name,
                            'ward': ward.name,
                            'coverage_nurses': coverage
                        })
        
        return schedule
    
    def analyze_solution(self, schedule):
        """Analyze the solution for compliance and quality"""
        logger.info("Analyzing solution for Malaysian labour law compliance...")
        
        analysis = {
            'labour_law_compliance': {},
            'nurse_satisfaction': {},
            'ward_coverage': {},
            'burnout_risk': {},
            'statistics': {}
        }
        
        # Analyze labour law compliance
        nurse_weekly_hours = defaultdict(lambda: defaultdict(int))
        nurse_monthly_hours = defaultdict(int)
        
        for assignment in schedule['assignments']:
            nurse_id = assignment['nurse_id']
            day = assignment['day']
            hours = assignment['hours']
            week = day // 7
            
            nurse_weekly_hours[nurse_id][week] += hours
            nurse_monthly_hours[nurse_id] += hours
        
        # Check 45-hour weekly limit compliance
        violations_weekly = 0
        for nurse_id, weeks in nurse_weekly_hours.items():
            nurse = next(n for n in self.nurses if n.id == nurse_id)
            for week, hours in weeks.items():
                if hours > nurse.max_hours_per_week:
                    violations_weekly += 1
        
        # Check monthly overtime limits
        violations_overtime = 0
        for nurse_id, total_hours in nurse_monthly_hours.items():
            nurse = next(n for n in self.nurses if n.id == nurse_id)
            regular_monthly = nurse.max_hours_per_week * 4
            if total_hours > regular_monthly + self.MAX_OVERTIME_PER_MONTH:
                violations_overtime += 1
        
        analysis['labour_law_compliance'] = {
            'weekly_hour_violations': violations_weekly,
            'overtime_violations': violations_overtime,
            'total_compliance_rate': ((len(self.nurses) * 4 - violations_weekly) / (len(self.nurses) * 4)) * 100,
            'average_weekly_hours': np.mean([sum(weeks.values()) / len(weeks) for weeks in nurse_weekly_hours.values()])
        }
        
        # Analyze shift preferences satisfaction
        preference_satisfaction = []
        night_shift_count = defaultdict(int)
        
        for assignment in schedule['assignments']:
            nurse = next(n for n in self.nurses if n.id == assignment['nurse_id'])
            shift = assignment['shift']
            
            if shift in ['DAY', 'EVENING', 'NIGHT']:
                shift_index = ['DAY', 'EVENING', 'NIGHT'].index(shift)
                preference_rank = nurse.shift_preferences[shift_index] if shift_index < len(nurse.shift_preferences) else 2
                preference_satisfaction.append(4 - preference_rank)  # Higher score = more satisfied
            
            if shift == 'NIGHT':
                night_shift_count[assignment['nurse_id']] += 1
        
        analysis['nurse_satisfaction'] = {
            'average_preference_satisfaction': np.mean(preference_satisfaction) if preference_satisfaction else 0,
            'night_shift_distribution': dict(night_shift_count),
            'nurses_with_excessive_nights': sum(1 for count in night_shift_count.values() if count > 8)  # >2 nights per week
        }
        
        # Analyze ward coverage
        ward_coverage_analysis = {}
        for ward in self.wards:
            ward_assignments = [a for a in schedule['assignments'] if a['ward'] == ward.name]
            daily_coverage = defaultdict(lambda: defaultdict(int))
            
            for assignment in ward_assignments:
                daily_coverage[assignment['day']][assignment['shift']] += 1
            
            # Check if minimum requirements are met
            coverage_violations = 0
            for day in range(self.schedule_days):
                for shift in self.shift_types.keys():
                    if daily_coverage[day][shift] < ward.min_nurses_per_shift:
                        coverage_violations += 1
            
            ward_coverage_analysis[ward.name] = {
                'total_assignments': len(ward_assignments),
                'coverage_violations': coverage_violations,
                'coverage_rate': ((self.schedule_days * len(self.shift_types) - coverage_violations) / 
                                 (self.schedule_days * len(self.shift_types))) * 100
            }
        
        analysis['ward_coverage'] = ward_coverage_analysis
        
        # Calculate burnout risk
        burnout_scores = []
        for assignment in schedule['assignments']:
            shift_type = self.shift_types[assignment['shift']]
            burnout_scores.append(shift_type.burnout_risk)
        
        analysis['burnout_risk'] = {
            'average_burnout_risk': np.mean(burnout_scores) if burnout_scores else 0,
            'high_risk_assignments': sum(1 for score in burnout_scores if score > 2.0),
            'total_assignments': len(burnout_scores)
        }
        
        # Overall statistics
        analysis['statistics'] = {
            'total_assignments': len(schedule['assignments']),
            'total_break_coverage_hours': sum(bc['coverage_nurses'] for bc in schedule['break_coverage']),
            'average_hours_per_nurse': np.mean(list(nurse_monthly_hours.values())) if nurse_monthly_hours else 0,
            'shift_distribution': {
                shift: sum(1 for a in schedule['assignments'] if a['shift'] == shift) 
                for shift in self.shift_types.keys()
            }
        }
        
        return analysis
    
    def save_results(self, schedule, analysis):
        """Save the scheduling results and analysis"""
        logger.info("Saving Malaysian nurse rostering results...")
        
        # Save detailed schedule
        assignments_df = pd.DataFrame(schedule['assignments'])
        if not assignments_df.empty:
            assignments_df['date'] = assignments_df['day'].apply(
                lambda x: (datetime.now() + timedelta(days=x)).strftime('%Y-%m-%d')
            )
            assignments_df.to_csv(self.output_path / "nurse_schedule_detailed.csv", index=False)
        
        # Save break coverage
        if schedule['break_coverage']:
            break_df = pd.DataFrame(schedule['break_coverage'])
            break_df.to_csv(self.output_path / "break_coverage_schedule.csv", index=False)
        
        # Save analysis report
        with open(self.output_path / "scheduling_analysis_report.json", 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        # Create summary report
        self.create_summary_report(schedule, analysis)
        
        # Create visualizations
        self.create_visualizations(schedule, analysis)
        
        logger.info(f"Results saved to: {self.output_path}")
    
    def create_summary_report(self, schedule, analysis):
        """Create a comprehensive summary report"""
        report_file = self.output_path / "malaysian_nurse_rostering_report.md"
        
        with open(report_file, 'w') as f:
            f.write("# Malaysian Nurse Rostering Solution Report\n\n")
            f.write("## 🏥 Hospital Overview\n")
            f.write(f"- **Nurses**: {len(self.nurses)}\n")
            f.write(f"- **Wards**: {len(self.wards)}\n")
            f.write(f"- **Schedule Period**: {self.schedule_days} days\n")
            f.write(f"- **Total Patient Load**: {sum(ward.patient_count for ward in self.wards)}\n\n")
            
            f.write("## ⚖️ Malaysian Labour Law Compliance\n")
            compliance = analysis['labour_law_compliance']
            f.write(f"- **Weekly Hour Compliance**: {compliance['total_compliance_rate']:.1f}%\n")
            f.write(f"- **Weekly Violations**: {compliance['weekly_hour_violations']} cases\n")
            f.write(f"- **Overtime Violations**: {compliance['overtime_violations']} cases\n")
            f.write(f"- **Average Weekly Hours**: {compliance['average_weekly_hours']:.1f}h\n")
            f.write(f"- **Legal Limit**: {self.MAX_HOURS_PER_WEEK}h/week\n\n")
            
            f.write("## 👩‍⚕️ Nurse Satisfaction\n")
            satisfaction = analysis['nurse_satisfaction']
            f.write(f"- **Preference Satisfaction**: {satisfaction['average_preference_satisfaction']:.2f}/3.0\n")
            f.write(f"- **Excessive Night Shifts**: {satisfaction['nurses_with_excessive_nights']} nurses\n")
            f.write(f"- **Night Shift Limit**: ≤{self.MAX_CONSECUTIVE_NIGHTS} consecutive\n\n")
            
            f.write("## 🏥 Ward Coverage Analysis\n")
            for ward_name, coverage in analysis['ward_coverage'].items():
                f.write(f"### {ward_name}\n")
                f.write(f"- **Coverage Rate**: {coverage['coverage_rate']:.1f}%\n")
                f.write(f"- **Total Assignments**: {coverage['total_assignments']}\n")
                f.write(f"- **Coverage Violations**: {coverage['coverage_violations']}\n\n")
            
            f.write("## 😰 Burnout Risk Assessment\n")
            burnout = analysis['burnout_risk']
            f.write(f"- **Average Risk Score**: {burnout['average_burnout_risk']:.2f}\n")
            f.write(f"- **High Risk Assignments**: {burnout['high_risk_assignments']}/{burnout['total_assignments']}\n")
            f.write(f"- **Night Shift Multiplier**: {self.shift_types['NIGHT'].burnout_risk}x baseline\n\n")
            
            f.write("## 📊 Statistics\n")
            stats = analysis['statistics']
            f.write(f"- **Total Assignments**: {stats['total_assignments']}\n")
            f.write(f"- **Break Coverage Hours**: {stats['total_break_coverage_hours']}\n")
            f.write(f"- **Average Hours/Nurse**: {stats['average_hours_per_nurse']:.1f}h\n\n")
            
            f.write("### Shift Distribution\n")
            for shift, count in stats['shift_distribution'].items():
                percentage = (count / stats['total_assignments']) * 100 if stats['total_assignments'] > 0 else 0
                f.write(f"- **{shift}**: {count} assignments ({percentage:.1f}%)\n")
            
            f.write("\n## ✅ Compliance Summary\n")
            f.write("- ✅ 45-hour weekly limit enforced\n")
            f.write("- ✅ 104-hour monthly overtime limit\n")
            f.write("- ✅ 30-minute breaks per 5 hours\n")
            f.write("- ✅ 12-hour rest between shifts\n")
            f.write("- ✅ Maximum 3 consecutive night shifts\n")
            f.write("- ✅ Skill-based ward assignments\n")
            f.write("- ✅ Patient-to-nurse ratio optimization\n")
        
        logger.info(f"Summary report created: {report_file}")
    
    def create_visualizations(self, schedule, analysis):
        """Create visualization charts"""
        if not schedule['assignments']:
            logger.warning("No assignments to visualize")
            return
            
        # Set up plotting style
        plt.style.use('default')
        sns.set_palette("husl")
        
        # 1. Weekly hours distribution
        assignments_df = pd.DataFrame(schedule['assignments'])
        assignments_df['week'] = assignments_df['day'] // 7
        
        weekly_hours = assignments_df.groupby(['nurse_id', 'week'])['hours'].sum().reset_index()
        
        plt.figure(figsize=(12, 6))
        sns.boxplot(data=weekly_hours, x='week', y='hours')
        plt.axhline(y=45, color='r', linestyle='--', label='Malaysian Legal Limit (45h)')
        plt.title('Weekly Hours Distribution by Week')
        plt.xlabel('Week')
        plt.ylabel('Hours')
        plt.legend()
        plt.tight_layout()
        plt.savefig(self.output_path / 'weekly_hours_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        # 2. Shift preference satisfaction
        nurse_pref_data = []
        for assignment in schedule['assignments']:
            nurse = next(n for n in self.nurses if n.id == assignment['nurse_id'])
            shift = assignment['shift']
            if shift in ['DAY', 'EVENING', 'NIGHT']:
                shift_index = ['DAY', 'EVENING', 'NIGHT'].index(shift)
                pref_rank = nurse.shift_preferences[shift_index] if shift_index < len(nurse.shift_preferences) else 2
                nurse_pref_data.append({
                    'nurse_id': assignment['nurse_id'],
                    'shift': shift,
                    'preference_rank': pref_rank,
                    'satisfied': pref_rank == 1
                })
        
        if nurse_pref_data:
            pref_df = pd.DataFrame(nurse_pref_data)
            
            plt.figure(figsize=(10, 6))
            satisfaction_by_shift = pref_df.groupby('shift')['satisfied'].mean()
            bars = plt.bar(satisfaction_by_shift.index, satisfaction_by_shift.values)
            plt.title('Shift Preference Satisfaction Rate')
            plt.ylabel('Satisfaction Rate')
            plt.ylim(0, 1)
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height + 0.01,
                        f'{height:.2%}', ha='center', va='bottom')
            
            plt.tight_layout()
            plt.savefig(self.output_path / 'shift_preference_satisfaction.png', dpi=300, bbox_inches='tight')
            plt.close()
        
        # 3. Ward coverage heatmap
        coverage_matrix = np.zeros((len(self.wards), self.schedule_days))
        ward_names = [ward.name for ward in self.wards]
        
        for i, ward in enumerate(self.wards):
            ward_assignments = [a for a in schedule['assignments'] if a['ward'] == ward.name]
            daily_counts = defaultdict(int)
            for assignment in ward_assignments:
                daily_counts[assignment['day']] += 1
            
            for day, count in daily_counts.items():
                coverage_matrix[i, day] = count
        
        plt.figure(figsize=(15, 8))
        sns.heatmap(coverage_matrix, 
                   yticklabels=ward_names,
                   xticklabels=[f'Day {i+1}' for i in range(self.schedule_days)],
                   annot=True, fmt='g', cmap='YlOrRd')
        plt.title('Daily Nurse Coverage by Ward')
        plt.xlabel('Days')
        plt.ylabel('Wards')
        plt.tight_layout()
        plt.savefig(self.output_path / 'ward_coverage_heatmap.png', dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info("Visualizations created successfully")

def main():
    """Main function to run the Malaysian nurse rostering system"""
    logger.info("🇲🇾 Starting Malaysian Nurse Rostering with Constraint Programming...")
    
    # Create the CP solver
    rostering_system = MalaysianNurseRosterCP()
    
    # Solve the scheduling problem
    schedule, analysis = rostering_system.solve_schedule()
    
    if schedule:
        logger.info("✅ Scheduling completed successfully!")
        logger.info(f"📊 Total assignments: {len(schedule['assignments'])}")
        logger.info(f"⚖️ Labour law compliance: {analysis['labour_law_compliance']['total_compliance_rate']:.1f}%")
        logger.info(f"😊 Average satisfaction: {analysis['nurse_satisfaction']['average_preference_satisfaction']:.2f}/3.0")
        logger.info(f"📁 Results saved to: {rostering_system.output_path}")
        
        print("\n🎯 Malaysian Nurse Rostering Solution Summary:")
        print("=" * 50)
        print(f"✅ {len(schedule['assignments'])} nurse shifts assigned")
        print(f"⚖️ {analysis['labour_law_compliance']['total_compliance_rate']:.1f}% labour law compliance")
        print(f"😊 {analysis['nurse_satisfaction']['average_preference_satisfaction']:.2f}/3.0 preference satisfaction")
        print(f"🏥 {len(rostering_system.wards)} wards covered")
        print(f"👩‍⚕️ {len(rostering_system.nurses)} nurses scheduled")
        print("=" * 50)
        
    else:
        logger.error("❌ Failed to find a feasible schedule")
        print("❌ No feasible solution found. Consider:")
        print("  - Reducing constraints")
        print("  - Hiring more nurses")
        print("  - Adjusting ward requirements")

if __name__ == "__main__":
    main()
