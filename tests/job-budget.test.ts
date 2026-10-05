import { afterEach, expect, it, vi } from "vitest";
import {
  JobBudgetExceeded,
  providerSignal,
  withJobBudget,
} from "@/lib/server/job-budget";
afterEach(() => vi.useRealTimers());
it("bounds an external call by the remaining worker budget", async () => {
  vi.useFakeTimers();
  const signal = await withJobBudget(Date.now() + 2000, async () =>
    providerSignal(),
  );
  expect(signal.aborted).toBe(false);
  await vi.advanceTimersByTimeAsync(2000);
  expect(signal.reason).toBeInstanceOf(JobBudgetExceeded);
});
it("does not start another external call once the worker budget is exhausted", async () => {
  await expect(
    withJobBudget(Date.now() - 1, async () => providerSignal()),
  ).rejects.toBeInstanceOf(JobBudgetExceeded);
});
