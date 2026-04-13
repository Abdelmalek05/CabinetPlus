declare module "better-sqlite3" {
  type DatabaseOptions = Record<string, never>;

  type StatementRunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  interface Statement<T = unknown> {
    all(...params: unknown[]): T[];
    get(...params: unknown[]): T | undefined;
    run(...params: unknown[]): StatementRunResult;
  }

  class Database {
    constructor(filename: string, options?: DatabaseOptions);

    pragma(query: string): void;
    exec(sql: string): void;
    prepare<T = unknown>(sql: string): Statement<T>;
    close(): void;
  }

  export default Database;
}