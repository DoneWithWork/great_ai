ALTER TABLE "chat" DROP CONSTRAINT "chat_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "chat" ADD CONSTRAINT "chat_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;