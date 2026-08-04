// `vocabulary` is a single shared table that every account studies from, and the
// CSV import writes to it with the service-role client (which bypasses RLS
// entirely). Signup is open, so "is logged in" is not a sufficient check -- any
// account could otherwise rewrite the word bank for everyone. Only the ids listed
// in ADMIN_USER_IDS may run that import.
//
// Deliberately fails closed: an unset or empty ADMIN_USER_IDS grants nobody access.

export function getAdminUserIds(): Set<string> {
  const raw = process.env.ADMIN_USER_IDS ?? "";

  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export function isAdminUser(userId: string): boolean {
  return getAdminUserIds().has(userId);
}
