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
    updatedAt: timestamp().defaultNow().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    deletedAt: timestamp(),
}
export const approvalStatus = pgEnum("approval_status", ["pending", "rejected", "approved"])
export const role = pgEnum("role", ["nurse", "admin"])
export const preferredShift = pgEnum("preferred_shift", ["day", "night", "flexible"])

export const users = pgTable("users", {
    id: text().primaryKey(),
    fullName: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).unique().notNull(),
    role: role().default("nurse"),
    bio: text(),
    onBoarded: boolean().default(false),
    preferredShift: preferredShift().default("flexible"),
    phone: varchar({ length: 15 }),
    department: varchar({ length: 100 }),
    ...timestamps,
})

export const usersRelations = relations(users, ({ one }) => ({
    nurse: one(nurse, {
        fields: [users.id],
        references: [nurse.userId],
    }),
}))

export const nurse = pgTable("nurse", {
    id: serial().primaryKey(),
    userId: text().references(() => users.id).notNull(),
    dateOfBirth: timestamp({ mode: "date" }),
    gender: genders(),
    contactInfo: varchar({ length: 255 }),
    hiredDate: timestamp({ mode: "date" }),
    familyStatus: boolean().default(false),
    contractHours: integer().default(45),
    active: boolean().default(true),
    ...timestamps,
})

export const nurseRelations = relations(nurse, ({ one, many }) => ({
    user: one(users, {
        fields: [nurse.userId],
        references: [users.id],
    }),
    leaveRequests: many(leaveRequest),
    rosters: many(roster),
}))

export const leaveRequest = pgTable("leaveRequest", {
    id: serial().primaryKey(),
    nurseId: integer().references(() => nurse.id).notNull(),
    startDate: timestamp({ mode: "date" }).notNull(),
    endDate: timestamp({ mode: "date" }).notNull(),
    leaveType: varchar({ length: 50 }).notNull(),
    reason: text(),
    approvalStatus: approvalStatus().default("pending"),
    submittedAt: timestamp().defaultNow(),
    reviewedAt: timestamp(),
})

export const leaveRequestRelations = relations(leaveRequest, ({ one }) => ({
    nurse: one(nurse, {
        fields: [leaveRequest.nurseId],
        references: [nurse.id],
    }),
}))

export const publicHolidays = pgTable("publicHolidays", {
    id: serial().primaryKey(),
    date: timestamp({ mode: "date" }).notNull(),
    description: text(),
    region: stateEnums().array().notNull(),
    createdAt: timestamp().defaultNow(),
})

export const wardTypes = pgEnum("ward_types", ["ICU", "GENERAL", "POST-OP", "Pediatric", "Maternity"])

export const patientCategories = pgTable("patientCategories", {
    id: serial().primaryKey(),
    name: varchar({ length: 50 }).notNull().unique(),
    description: text(),
    severityLevel: integer().notNull().default(1),
    nursesRequired: integer().notNull().default(1),
    patientsSupported: integer().notNull().default(1),
    ...timestamps,
}, (table) => [
    check("severityLevel", sql`${table.severityLevel} BETWEEN 1 AND 4`),
])

export const patient = pgTable("patient", {
    id: serial().primaryKey(),
    fullName: varchar({ length: 255 }).notNull(),
    dateOfBirth: timestamp({ mode: "date" }),
    admissionDate: timestamp({ mode: "date" }).notNull(),
    dischargeDate: timestamp({ mode: "date" }),
    categoryId: integer().references(() => patientCategories.id).notNull(),
    ...timestamps,
})

export const patientRelations = relations(patient, ({ one }) => ({
    category: one(patientCategories, {
        fields: [patient.categoryId],
        references: [patientCategories.id],
    }),
}))

export const shiftTypes = pgEnum("shift_types", ["day", "night", "on_call"])

export const shifts = pgTable("shifts", {
    id: serial().primaryKey(),
    name: varchar({ length: 100 }).notNull(),
    startTime: timestamp().notNull(),
    endTime: timestamp().notNull(),
    shiftType: shiftTypes().notNull(),
    ...timestamps,
})

export const shiftsRelations = relations(shifts, ({ many }) => ({
    rosters: many(roster),
}))

export const roster = pgTable("roster", {
    id: serial().primaryKey(),
    nurseId: integer().references(() => nurse.id).notNull(),
    shiftId: integer().references(() => shifts.id).notNull(),
    date: timestamp({ mode: "date" }).notNull(),
    ...timestamps,
})

export const rosterRelations = relations(roster, ({ one }) => ({
    nurse: one(nurse, {
        fields: [roster.nurseId],
        references: [nurse.id],
    }),
    shift: one(shifts, {
        fields: [roster.shiftId],
        references: [shifts.id],
    }),
}))



export const chat = pgTable("chat", {
    id: serial().primaryKey(),
    userId: text().references(() => users.id, { onDelete: "cascade" }).notNull(),
    title: text(),
    ...timestamps
})
export const message = pgTable("message", {
    id: serial().primaryKey(),
    chatId: integer().references(() => chat.id).notNull(),
    userId: text().references(() => users.id).notNull(),
    isAssistant: boolean().default(false).notNull(),
    content: text().notNull(),
    ...timestamps
})
export const messageRelations = relations(message, ({ one }) => ({
    chat: one(chat, {
        fields: [message.chatId],
        references: [chat.id],
    }),
    user: one(users, {
        fields: [message.userId],
        references: [users.id],
    }),
}));

export const chatRelations = relations(chat, ({ one, many }) => ({
    messages: many(message),
    user: one(users, {
        fields: [chat.userId],
        references: [users.id],
    }),
}))


// Types inferred from tables
export type User = {
    id: string;
    fullName: string;
    email: string;
    role: "nurse" | "admin";
    bio?: string | null;
    onBoarded: boolean;
    preferredShift: "day" | "night" | "flexible";
    phone?: string | null;
    department?: string | null;
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};

export type Nurse = {
    id: number;
    userId: string;
    dateOfBirth?: Date | null;
    gender?: "male" | "female" | "other" | null;
    contactInfo?: string | null;
    hiredDate?: Date | null;
    familyStatus: boolean;
    contractHours: number;
    active: boolean;
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};

export type LeaveRequest = {
    id: number;
    nurseId: number;
    startDate: Date;
    endDate: Date;
    leaveType: string;
    reason?: string | null;
    approvalStatus: "pending" | "rejected" | "approved";
    submittedAt: Date;
    reviewedAt?: Date | null;
};

export type PublicHoliday = {
    id: number;
    date: Date;
    description?: string | null;
    region: Array<"selangor" | "pahang" | "kedah" | "johor" | "perak" | "perlis" | "melaka">;
    createdAt: Date;
};

export type PatientCategory = {
    id: number;
    name: string;
    description?: string | null;
    severityLevel: number;
    nursesRequired: number;
    patientsSupported: number;
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};

export type Patient = {
    id: number;
    fullName: string;
    dateOfBirth?: Date | null;
    admissionDate: Date;
    dischargeDate?: Date | null;
    categoryId: number;
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};

export type Shift = {
    id: number;
    name: string;
    startTime: Date;
    endTime: Date;
    shiftType: "day" | "night" | "on_call";
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};

export type Roster = {
    id: number;
    nurseId: number;
    shiftId: number;
    date: Date;
    updatedAt: Date;
    createdAt: Date;
    deletedAt?: Date | null;
};


