# Nurse Roster Database Schema

This schema models a nurse roster management system. It includes users, nurses, shifts, rosters, leave requests, patients, and supporting entities like holidays and patient categories.

---

## **Enums**

- **genders** → `male`, `female`, `other`
- **states** → `selangor`, `pahang`, `kedah`, `johor`, `perak`, `perlis`, `melaka`
- **approval_status** → `pending`, `rejected`, `approved`
- **role** → `nurse`, `admin`
- **preferred_shift** → `day`, `night`, `flexible`
- **ward_types** → `ICU`, `GENERAL`, `POST-OP`, `Pediatric`, `Maternity`
- **shift_types** → `day`, `night`, `on_call`

---

## **Tables**

### **users**
- `id` (text, PK)
- `fullName` (varchar, required)
- `email` (varchar, unique, required)
- `role` (enum `role`, default: `nurse`)
- `bio` (text)
- `onBoarded` (boolean, default: false)
- `preferredShift` (enum `preferred_shift`, default: `flexible`)
- `phone` (varchar(15))
- `department` (varchar(100))
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:** one-to-one with `nurse`.

---

### **nurse**
- `id` (serial, PK)
- `userId` (text, FK → users.id)
- `dateOfBirth` (date)
- `gender` (enum `genders`)
- `contactInfo` (varchar)
- `hiredDate` (date)
- `familyStatus` (boolean, default: false)
- `contractHours` (integer, default: 45)
- `active` (boolean, default: true)
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- one-to-one with `users`
- one-to-many with `leaveRequest`
- one-to-many with `roster`

---

### **leaveRequest**
- `id` (serial, PK)
- `nurseId` (int, FK → nurse.id)
- `startDate`, `endDate` (date)
- `leaveType` (varchar(50), required)
- `reason` (text)
- `approvalStatus` (enum `approval_status`, default: `pending`)
- `submittedAt` (timestamp, default now)
- `reviewedAt` (timestamp)

**Relations:** many-to-one with `nurse`

---

### **publicHolidays**
- `id` (serial, PK)
- `date` (date, required)
- `description` (text)
- `region` (array of `states`, required)
- `createdAt` (timestamp)

---

### **patientCategories**
- `id` (serial, PK)
- `name` (varchar(50), unique, required)
- `description` (text)
- `severityLevel` (integer, 1–4)
- `nursesRequired` (integer, default: 1)
- `patientsSupported` (integer, default: 1)
- `createdAt`, `updatedAt`, `deletedAt`

---

### **patient**
- `id` (serial, PK)
- `fullName` (varchar, required)
- `dateOfBirth` (date)
- `admissionDate` (date, required)
- `dischargeDate` (date)
- `categoryId` (int, FK → patientCategories.id)
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:** many-to-one with `patientCategories`

---

### **shifts**
- `id` (serial, PK)
- `name` (varchar(100), required)
- `startTime`, `endTime` (timestamp, required)
- `shiftType` (enum `shift_types`, required)
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:** one-to-many with `roster`

---

### **roster**
- `id` (serial, PK)
- `nurseId` (int, FK → nurse.id)
- `shiftId` (int, FK → shifts.id)
- `date` (date, required)
- `createdAt`, `updatedAt`, `deletedAt`

**Relations:**
- many-to-one with `nurse`
- many-to-one with `shifts`

---

## **Entity Relationships (Simplified)**

- **User ↔ Nurse**: One user account belongs to one nurse.
- **Nurse ↔ LeaveRequest**: A nurse can submit many leave requests.
- **Nurse ↔ Roster ↔ Shifts**: A nurse is assigned to many shifts through the roster.
- **Patient ↔ PatientCategory**: Patients are categorised for staffing requirements.
- **PublicHolidays**: Standalone reference table for scheduling.
