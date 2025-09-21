import numpy as np

# -------------------------
# 1. Load CSV
# -------------------------
data = np.genfromtxt(
    "./influenza_data.csv", delimiter=",", encoding="utf-8", skip_header=1, dtype=str
)

# -------------------------
# 2. Replace 'NA' with '0'
# -------------------------
data[data == "NA"] = "0"

# -------------------------
# 3. Extract relevant columns
# Columns in CSV:
# 0 = Country
# 1 = Surveillance site type
# 2 = Year-week
# 3 = Week start date
# 4 = Specimen tested
# 5 = Influenza positive
# 6 = Influenza negative
# 7 = A(H1N1)pdm09
# 8 = A(H3)
# 9 = A not subtyped
# 10 = B(Victoria)
# 11 = B(Yamagata)
# 12 = B(lineage not determined)
# -------------------------
weeks = data[:, 2]  # Year-week
specimens_tested = data[:, 4].astype(int)
influenza_positive = data[:, 5].astype(int)

# -------------------------
# 4. Compute hospitalised patients
# -------------------------
hospitalised = influenza_positive * 0.01  # 1% admitted to hospital

# -------------------------
# 5. Compute total admissions accounting for previous week
# -------------------------
total_admissions = np.zeros_like(hospitalised, dtype=float)

for i in range(len(hospitalised)):
    if i == 0:
        total_admissions[i] = hospitalised[i]
    else:
        total_admissions[i] = hospitalised[i] + hospitalised[i - 1]

# -------------------------
# 6. Compute ICU and General Ward nurses
# ICU: 16.5%, 1 nurse per 2 patients
# GW: 83.5%, 1 nurse per 4 patients
# -------------------------
icu_nurses = (total_admissions * 0.165) / 2
gw_nurses = (total_admissions * 0.835) / 4
total_nurses = icu_nurses + gw_nurses

# -------------------------
# 7. Combine results for inspection
# -------------------------
results = np.column_stack(
    (weeks, total_admissions, icu_nurses, gw_nurses, total_nurses)
)

print("Week | Total Admissions | ICU Nurses | GW Nurses | Total Nurses")
for row in results:
    print(row)

# -------------------------
# 8. Optional: Save to CSV for modeling
# -------------------------
np.savetxt(
    "weekly_nurse_requirements.csv",
    results,
    delimiter=",",
    fmt="%s",
    header="Week,Total_Admissions,ICU_Nurses,GW_Nurses,Total_Nurses",
    comments="",
)
