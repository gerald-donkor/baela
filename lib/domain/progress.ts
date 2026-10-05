export type Interval = [number, number];
export function mergeIntervals(
  input: Interval[],
  duration: number,
): Interval[] {
  const sorted = input
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b > a)
    .map(([a, b]) => [Math.max(0, a), Math.min(duration, b)] as Interval)
    .filter(([a, b]) => b > a)
    .sort((a, b) => a[0] - b[0]);
  const result: Interval[] = [];
  for (const interval of sorted) {
    const last = result.at(-1);
    if (last && interval[0] <= last[1] + 0.25)
      last[1] = Math.max(last[1], interval[1]);
    else result.push([...interval]);
  }
  return result;
}
export function watchedRatio(intervals: Interval[], duration: number) {
  return duration > 0
    ? mergeIntervals(intervals, duration).reduce(
        (sum, [a, b]) => sum + b - a,
        0,
      ) / duration
    : 0;
}
export function coursePercentage(completed: number, published: number) {
  return published
    ? Math.min(100, Math.round((completed / published) * 100))
    : 0;
}
