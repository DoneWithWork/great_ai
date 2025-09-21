// lib/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL!;

// Prevent creating new connections in dev with hot reload
const globalForDb = globalThis as unknown as { postgresClient?: ReturnType<typeof postgres> };

const client =
    globalForDb.postgresClient ??
    postgres(connectionString, {
        max: 5, // keep small, Supabase pooler limit is tight on free/pro
        idle_timeout: 20,
        connect_timeout: 30,
    });

if (process.env.NODE_ENV !== "production") globalForDb.postgresClient = client;

export const db = drizzle(client, { schema });
