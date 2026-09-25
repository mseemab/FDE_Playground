import "server-only";

/**
 * Placeholder persistence for waitlist signups. Replace with real storage (e.g. a Supabase table
 * via the add-backend and add-db-table skills) when the brief calls for it.
 */
export async function addToWaitlist(email: string): Promise<void> {
  await Promise.resolve();
  console.info(`[waitlist] signup received (${String(email.length)} chars)`);
}
