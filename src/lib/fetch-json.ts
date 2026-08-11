/**
 * Every client-side call to this app's API routes goes through here.
 *
 * Hand-rolled `await fetch(...)` then `await response.json()` breaks in two ways
 * that both end with the UI stuck in a loading state and no message on screen: a
 * network failure rejects the fetch, and any non-JSON body (an HTML error page, a
 * login page served after a redirect) makes .json() throw. Both are turned into a
 * normal `{ ok: false, message }` result here so callers only handle one shape.
 */
export type JsonResult<T> = ({ ok: true } & T) | { ok: false; message: string };

const GENERIC_FAILURE = "Could not reach the server. Please check your connection and try again.";

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<JsonResult<T>> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    return { ok: false, message: GENERIC_FAILURE };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      message: response.status === 401 ? "Your session expired. Please sign in again." : GENERIC_FAILURE
    };
  }

  if (payload && typeof payload === "object" && "ok" in payload) {
    const result = payload as JsonResult<T>;
    // A truthy `ok` in the body still loses to a failed HTTP status.
    if (!response.ok && result.ok) {
      return { ok: false, message: GENERIC_FAILURE };
    }
    return result;
  }

  return response.ok ? ({ ok: true, ...(payload as T) } as JsonResult<T>) : { ok: false, message: GENERIC_FAILURE };
}
