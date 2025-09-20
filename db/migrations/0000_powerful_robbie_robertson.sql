CREATE TYPE "public"."approval_status" AS ENUM('pending', 'rejected', 'approved');--> statement-breakpoint
CREATE TYPE "public"."genders" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('nurse', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shift_types" AS ENUM('day', 'night', 'on_call');--> statement-breakpoint
CREATE TYPE "public"."states" AS ENUM('selangor', 'pahang', 'kedah', 'johor', 'perak', 'perlis', 'melaka');--> statement-breakpoint
CREATE TYPE "public"."ward_types" AS ENUM('ICU', 'GENERAL', 'POST-OP', 'Pediatric', 'Maternity');--> statement-breakpoint
CREATE TABLE "leaveRequest" (
	"id" serial PRIMARY KEY NOT NULL,
	"nurseId" integer NOT NULL,
	"startDate" timestamp NOT NULL,
	"endDate" timestamp NOT NULL,
	"leaveType" varchar(50) NOT NULL,
	"reason" text,
	"approvalStatus" "approval_status" DEFAULT 'pending',
	"submittedAt" timestamp DEFAULT now(),
	"reviewedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "nurse" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"dateOfBirth" timestamp,
	"gender" "genders",
	"contactInfo" varchar(255),
	"hiredDate" timestamp,
	"familyStatus" boolean DEFAULT false,
	"contractHours" integer DEFAULT 45,
	"active" boolean DEFAULT true,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" serial PRIMARY KEY NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"dateOfBirth" timestamp,
	"admissionDate" timestamp NOT NULL,
	"dischargeDate" timestamp,
	"categoryId" integer NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "patientCategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"severityLevel" integer DEFAULT 1 NOT NULL,
	"nursesRequired" integer DEFAULT 1 NOT NULL,
	"patientsSupported" integer DEFAULT 1 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "patientCategories_name_unique" UNIQUE("name"),
	CONSTRAINT "severityLevel" CHECK ("patientCategories"."severityLevel" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "publicHolidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"region" "states"[] NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roster" (
	"id" serial PRIMARY KEY NOT NULL,
	"nurseId" integer NOT NULL,
	"shiftId" integer NOT NULL,
	"date" timestamp NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"shiftType" "shift_types" NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"clerkId" varchar(255) NOT NULL,
	"fullName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'nurse',
	"onBoarded" boolean DEFAULT false,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"deletedAt" timestamp,
	CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leaveRequest" ADD CONSTRAINT "leaveRequest_nurseId_nurse_id_fk" FOREIGN KEY ("nurseId") REFERENCES "public"."nurse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse" ADD CONSTRAINT "nurse_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_categoryId_patientCategories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."patientCategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_nurseId_nurse_id_fk" FOREIGN KEY ("nurseId") REFERENCES "public"."nurse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_shiftId_shifts_id_fk" FOREIGN KEY ("shiftId") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;