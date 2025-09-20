CREATE TYPE "public"."approval_status" AS ENUM('pending', 'rejected', 'approved');--> statement-breakpoint
CREATE TYPE "public"."genders" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('nurse', 'admin');--> statement-breakpoint
CREATE TYPE "public"."shift_types" AS ENUM('day', 'night', 'on_call');--> statement-breakpoint
CREATE TYPE "public"."states" AS ENUM('selangor', 'pahang', 'kedah', 'johor', 'perak', 'perlis', 'melaka');--> statement-breakpoint
CREATE TYPE "public"."ward_types" AS ENUM('ICU', 'GENERAL', 'POST-OP', 'Pediatric', 'Maternity');--> statement-breakpoint
CREATE TABLE "leave_request" (
	"id" serial PRIMARY KEY NOT NULL,
	"nurse_id" integer NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"leave_type" varchar(50) NOT NULL,
	"reason" text,
	"approval_status" "approval_status" DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "nurse" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date_of_birth" timestamp,
	"gender" "genders",
	"contact_info" varchar(255),
	"hired_date" timestamp,
	"family_status" boolean DEFAULT false,
	"contract_hours" integer DEFAULT 45,
	"active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"date_of_birth" timestamp,
	"admission_date" timestamp NOT NULL,
	"discharge_date" timestamp,
	"category_id" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "patient_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"severity_level" integer DEFAULT 1 NOT NULL,
	"nurses_required" integer DEFAULT 1 NOT NULL,
	"patients_supported" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "patient_categories_name_unique" UNIQUE("name"),
	CONSTRAINT "severityLevel" CHECK ("patient_categories"."severity_level" BETWEEN 1 AND 4)
);
--> statement-breakpoint
CREATE TABLE "public_holidays" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"description" text,
	"region" "states"[] NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roster" (
	"id" serial PRIMARY KEY NOT NULL,
	"nurse_id" integer NOT NULL,
	"shift_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"shift_type" "shift_types" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'nurse',
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leave_request" ADD CONSTRAINT "leave_request_nurse_id_nurse_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."nurse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nurse" ADD CONSTRAINT "nurse_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient" ADD CONSTRAINT "patient_category_id_patient_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."patient_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_nurse_id_nurse_id_fk" FOREIGN KEY ("nurse_id") REFERENCES "public"."nurse"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster" ADD CONSTRAINT "roster_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;