export type HealthState = "ok" | "degraded" | "error";
export type HealthChecks = Record<string, HealthState>;

export function getOverallHealthState(checks: HealthChecks): HealthState {
  const values = Object.values(checks);
  return values.includes("error") ? "error" : values.includes("degraded") ? "degraded" : "ok";
}
