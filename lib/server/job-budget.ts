import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";

const budget = new AsyncLocalStorage<number>();
export class JobBudgetExceeded extends Error {
  constructor() {
    super("Worker time budget exhausted; continuing on the next invocation.");
  }
}
export function withJobBudget<T>(deadline: number, work: () => Promise<T>) {
  return budget.run(deadline, work);
}
export function providerSignal(timeout = 15000) {
  const deadline = budget.getStore();
  if (deadline === undefined) return AbortSignal.timeout(timeout);
  // Reserve time to persist the result or reschedule before the route terminates.
  const remaining = deadline - Date.now();
  if (remaining <= 1000) throw new JobBudgetExceeded();
  if (remaining >= timeout) return AbortSignal.timeout(timeout);
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new JobBudgetExceeded()),
    remaining,
  );
  timer.unref();
  return controller.signal;
}
