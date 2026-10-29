// Use only for reads or operations with server-side idempotency.
export const isTemporaryConnectionError = (error) =>
  ["FETCH_ERROR", "TIMEOUT_ERROR", 502, 503, 504].includes(error?.status);

export const transientRetryOptions = {
  retryCondition: (error, _args, { attempt, baseQueryApi }) =>
    attempt <= 2 && !baseQueryApi.signal.aborted && isTemporaryConnectionError(error),
  // Give a restarting API time to reconnect, with a small jitter across clients.
  backoff: (attempt, _maxRetries, signal) => new Promise((resolve, reject) => {
    const finish = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(finish, 2_000 * attempt + Math.random() * 300);
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal?.aborted) abort();
    else signal?.addEventListener("abort", abort, { once: true });
  }),
};
