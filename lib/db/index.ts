import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";
import { required } from "@/lib/config";
neonConfig.webSocketConstructor = ws;
function connect() {
  const pool = new Pool({ connectionString: required("DATABASE_URL"), max: 2 });
  return { pool, db: drizzle({ client: pool, schema }) };
}
export type Database = ReturnType<typeof connect>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
export type Db = Database | Transaction;
export async function withDb<T>(fn: (db: Database) => Promise<T>): Promise<T> {
  const { pool, db } = connect();
  try {
    return await fn(db);
  } finally {
    await pool.end();
  }
}
