// Postgres/PostgREST error messages name columns, types, and constraints -- useful
// in a server log, but they should never reach the browser. Every data-layer
// failure funnels through here so the detail is logged once and the caller only
// ever sees a generic, actionable sentence.

const GENERIC_MESSAGE = "Something went wrong loading your data. Please try again.";

export class DataAccessError extends Error {
  readonly scope: string;

  constructor(scope: string, message = GENERIC_MESSAGE) {
    super(message);
    this.name = "DataAccessError";
    this.scope = scope;
  }
}

type QueryError = { message: string; code?: string; details?: string | null } | Error;

function describe(error: QueryError) {
  return error instanceof Error ? error.message : `${error.code ?? "unknown"}: ${error.message}`;
}

/** Logs the real error server-side, then throws a safe one. For render paths. */
export function throwDataError(scope: string, error: QueryError): never {
  console.error(`[data:${scope}]`, describe(error));
  throw new DataAccessError(scope);
}

/** Logs the real error server-side, then returns a safe message. For server actions. */
export function safeErrorMessage(scope: string, error: QueryError): string {
  console.error(`[action:${scope}]`, describe(error));
  return GENERIC_MESSAGE;
}
