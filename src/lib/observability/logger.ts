import { getObservabilityEnv } from "@/lib/config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown> & {
  error?: unknown;
  requestId?: string;
};

const logLevelRank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function shouldLog(level: LogLevel) {
  const env = getObservabilityEnv();
  return logLevelRank[level] >= logLevelRank[env.LOG_LEVEL];
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return error;
  }

  return {
    message: error.message,
    name: error.name,
    stack: error.stack
  };
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) {
    return;
  }

  const env = getObservabilityEnv();
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    deploymentEnv: env.DEPLOYMENT_ENV,
    buildSha: env.BUILD_SHA ?? null,
    ...context,
    error: context?.error ? serializeError(context.error) : undefined
  };

  const output = JSON.stringify(entry);

  if (level === "debug") {
    console.debug(output);
    return;
  }

  if (level === "info") {
    console.info(output);
    return;
  }

  if (level === "warn") {
    console.warn(output);
    return;
  }

  console.error(output);
}

export const logger = {
  debug(message: string, context?: LogContext) {
    writeLog("debug", message, context);
  },
  info(message: string, context?: LogContext) {
    writeLog("info", message, context);
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context);
  },
  error(message: string, context?: LogContext) {
    writeLog("error", message, context);
  }
};
