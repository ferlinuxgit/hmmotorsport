ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;