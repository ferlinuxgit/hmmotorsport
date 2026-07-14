export type HealthState = "ok" | "degraded" | "error";
export type HealthChecks = Record<"app" | "configuration" | "database" | "payments", HealthState>;

export function getOverallHealthState(checks: HealthChecks): HealthState {
  const values = Object.values(checks);
  return values.includes("error") ? "error" : values.includes("degraded") ? "degraded" : "ok";
}
