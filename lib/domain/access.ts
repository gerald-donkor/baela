export type Grant = {
  kind: "course" | "monthly" | "lifetime";
  courseId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  revokedAt: Date | null;
};
export type Access = {
  allowed: boolean;
  reason: "preview" | "course" | "monthly" | "lifetime" | "locked";
  expiresAt: Date | null;
};

export function evaluateAccess(
  courseId: string,
  preview: boolean,
  published: boolean,
  grants: Grant[],
  now = new Date(),
): Access {
  if (!published) return { allowed: false, reason: "locked", expiresAt: null };
  if (preview) return { allowed: true, reason: "preview", expiresAt: null };
  const valid = grants.filter(
    (g) => !g.revokedAt && g.startsAt <= now && (!g.endsAt || g.endsAt > now),
  );
  for (const kind of ["lifetime", "course", "monthly"] as const) {
    const matching = valid.filter(
      (g) => g.kind === kind && (kind !== "course" || g.courseId === courseId),
    );
    if (matching.length) {
      const endsAt = matching.some((g) => !g.endsAt)
        ? null
        : new Date(Math.max(...matching.map((g) => g.endsAt!.getTime())));
      return { allowed: true, reason: kind, expiresAt: endsAt };
    }
  }
  return { allowed: false, reason: "locked", expiresAt: null };
}
export function hasAllAccess(grants: Grant[], now = new Date()) {
  return evaluateAccess(
    "",
    false,
    true,
    grants.filter((g) => g.kind !== "course"),
    now,
  ).allowed;
}
export function isFullRefund(netAmount: number, refundedAmount: number) {
  return netAmount > 0 && refundedAmount >= netAmount;
}
