import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbDir = path.resolve(process.cwd(), "electron", "db");
const schemaPath = path.join(dbDir, "schema.sql");
const dbPath = path.join(dbDir, "cabinetplus.db");

if (!fs.existsSync(schemaPath)) {
  console.error(`Schema file not found: ${schemaPath}`);
  process.exit(1);
}

const schemaSql = fs.readFileSync(schemaPath, "utf8");
const db = new Database(dbPath);

try {
  db.pragma("foreign_keys = ON");
  db.exec(schemaSql);
  console.log(`Database initialized successfully: ${dbPath}`);
} catch (error) {
  console.error("Failed to initialize database schema.");
  console.error(error);
  process.exitCode = 1;
} finally {
  db.close();
}
