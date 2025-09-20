CREATE TYPE "public"."preferred_shift" AS ENUM('day', 'night', 'flexible');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferredShift" "preferred_shift" DEFAULT 'flexible';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(15);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" varchar(100);