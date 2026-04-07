export const AUTH_COOKIE_NAME = "cabinetplus_auth";

export function buildSessionValue(username: string) {
  return `session:${username.toLowerCase()}`;
}
