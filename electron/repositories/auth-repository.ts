import "server-only";

import { getDatabase } from "./db";
import type { LoginAccount } from "./types";

type LoginRow = {
  ID: number;
  login: string;
  password: string;
  Nom: string;
  Prenom: string;
  Specialite: string;
  Adresse: string;
  Ville: string;
  Tel: string;
  mail: string;
  lastaccess: string | null;
  IP: string | null;
};

function mapLoginRow(row: LoginRow): LoginAccount {
  return {
    id: row.ID,
    login: row.login,
    password: row.password,
    name: row.Nom,
    firstName: row.Prenom,
    specialite: row.Specialite,
    address: row.Adresse,
    ville: row.Ville,
    tel: row.Tel,
    mail: row.mail,
    lastAccess: row.lastaccess ?? "",
    ip: row.IP ?? "",
  };
}

export function findAccountByLogin(login: string): LoginAccount | null {
  const normalizedLogin = login.trim().toLowerCase();

  if (!normalizedLogin) {
    return null;
  }

  const database = getDatabase();
  const row = database
    .prepare(
      `
        SELECT
          ID,
          login,
          password,
          Nom,
          Prenom,
          Specialite,
          Adresse,
          Ville,
          Tel,
          mail,
          lastaccess,
          IP
        FROM login
        WHERE lower(login) = ?
        LIMIT 1
      `,
    )
    .get(normalizedLogin) as LoginRow | undefined;

  return row ? mapLoginRow(row) : null;
}

export function listAccounts(): LoginAccount[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          ID,
          login,
          password,
          Nom,
          Prenom,
          Specialite,
          Adresse,
          Ville,
          Tel,
          mail,
          lastaccess,
          IP
        FROM login
        ORDER BY ID ASC
      `,
    )
    .all() as LoginRow[];

  return rows.map(mapLoginRow);
}