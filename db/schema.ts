import { sql, relations } from "drizzle-orm"
import {
    integer,
    text,
    boolean,
    pgTable,
    serial,
    timestamp,
    pgEnum,
    varchar,
    check
} from "drizzle-orm/pg-core"

export const genders = pgEnum("genders", ["male", "female", "other"])
export const stateEnums = pgEnum("states", [
    "selangor", "pahang", "kedah", "johor", "perak", "perlis", "melaka"
])
const timestamps = {
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
}
export const approvalStatus = pgEnum("approval_status", ["pending", "rejected", "approved"])
export const role = pgEnum("role", ['nurse', 'admin'])

export const users = pgTable("users", {
    id: serial().primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).unique().notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    role: role("role").default("nurse"),
    ...timestamps
})

export const usersRelations = relations(users, ({ one }) => ({
    nurse: one(nurse, {
        fields: [users.id],
        references: [nurse.userId],
    }),
}));

export const nurse = pgTable("nurse", {
    id: serial().primaryKey(),
    userId: integer("user_id").references(() => users.id).notNull(),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
    gender: genders("gender"),
    contactInfo: varchar("contact_info", { length: 255 }),
    hiredDate: timestamp("hired_date", { mode: "date" }),
    familyStatus: boolean("family_status").default(false),
    contractHours: integer("contract_hours").default(45),
    active: boolean("active").default(true),
    ...timestamps
})

export const nurseRelations = relations(nurse, ({ one, many }) => ({
    user: one(users, {
        fields: [nurse.userId],
        references: [users.id],
    }),
    leaveRequests: many(leaveRequest),
    rosters: many(roster),
}));


export const leaveRequest = pgTable("leave_request", {
    id: serial().primaryKey(),
    nurseId: integer("nurse_id").references(() => nurse.id).notNull(),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    leaveType: varchar("leave_type", { length: 50 }).notNull(),
    reason: text("reason"),
    approvalStatus: approvalStatus("approval_status").default("pending"),
    submittedAt: timestamp("submitted_at").defaultNow(),
    reviewedAt: timestamp("reviewed_at")
})

export const leaveRequestRelations = relations(leaveRequest, ({ one }) => ({
    nurse: one(nurse, {
        fields: [leaveRequest.nurseId],
        references: [nurse.id],
    }),
}));

export const publicHolidays = pgTable("public_holidays", {
    id: serial().primaryKey(),
    date: timestamp("date", { mode: "date" }).notNull(),
    description: text("description"),
    region: stateEnums("region").array().notNull(),
    createdAt: timestamp("created_at").defaultNow()
})


export const wardTypes = pgEnum("ward_types", ['ICU', 'GENERAL', 'POST-OP', 'Pediatric', 'Maternity'])
export const patientCategories = pgTable("patient_categories", {
    id: serial().primaryKey(),
    name: varchar("name", { length: 50 }).notNull().unique(),
    description: text("description"),
    severityLevel: integer("severity_level").notNull().default(1),
    nursesRequired: integer("nurses_required").notNull().default(1),
    patientsSupported: integer("patients_supported").notNull().default(1),
    ...timestamps
}, (table) => [
    check("severityLevel", sql`${table.severityLevel} BETWEEN 1 AND 4`)
])

export const patient = pgTable("patient", {
    id: serial().primaryKey(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
    admissionDate: timestamp("admission_date", { mode: "date" }).notNull(),
    dischargeDate: timestamp("discharge_date", { mode: "date" }),
    categoryId: integer("category_id").references(() => patientCategories.id).notNull(),
    ...timestamps
})

export const patientRelations = relations(patient, ({ one }) => ({
    category: one(patientCategories, {
        fields: [patient.categoryId],
        references: [patientCategories.id],
    }),
}));

export const shiftTypes = pgEnum("shift_types", ["day", "night", "on_call"]);

export const shifts = pgTable("shifts", {
    id: serial().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    shiftType: shiftTypes("shift_type").notNull(),
    ...timestamps
});

export const shiftsRelations = relations(shifts, ({ many }) => ({
    rosters: many(roster),
}));

export const roster = pgTable("roster", {
    id: serial().primaryKey(),
    nurseId: integer("nurse_id").references(() => nurse.id).notNull(),
    shiftId: integer("shift_id").references(() => shifts.id).notNull(),
    date: timestamp("date", { mode: "date" }).notNull(),
    ...timestamps
});

export const rosterRelations = relations(roster, ({ one }) => ({
    nurse: one(nurse, {
        fields: [roster.nurseId],
        references: [nurse.id],
    }),
    shift: one(shifts, {
        fields: [roster.shiftId],
        references: [shifts.id],
    }),
}));