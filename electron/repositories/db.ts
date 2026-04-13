import "server-only";

import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const databaseFilePath = path.join(process.cwd(), "electron", "db", "cabinetplus.db");
const schemaFilePath = path.join(process.cwd(), "electron", "db", "schema.sql");

type SqliteDatabase = {
  pragma(query: string): void;
  exec(sql: string): void;
  prepare<T = unknown>(sql: string): {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | undefined;
    run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  };
  close(): void;
};

const DatabaseConstructor = Database as unknown as new (filename: string) => SqliteDatabase;

let databaseInstance: SqliteDatabase | null = null;

function ensureDatabaseExists() {
  const directoryPath = path.dirname(databaseFilePath);

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  if (fs.existsSync(databaseFilePath)) {
    return;
  }

  const schemaSql = fs.readFileSync(schemaFilePath, "utf8");
  const database = new DatabaseConstructor(databaseFilePath);

  try {
    database.pragma("foreign_keys = ON");
    database.exec(schemaSql);
  } finally {
    database.close();
  }
}

export function getDatabase() {
  if (databaseInstance) {
    return databaseInstance;
  }

  ensureDatabaseExists();
  databaseInstance = new DatabaseConstructor(databaseFilePath);
  databaseInstance.pragma("foreign_keys = ON");

  return databaseInstance;
}