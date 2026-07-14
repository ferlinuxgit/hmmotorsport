"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

const sessionStorageKey = "baseboilerplate.analytics.session";

function getSessionId() {
  const existing = window.localStorage.getItem(sessionStorageKey);

  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  window.localStorage.setItem(sessionStorageKey, sessionId);
  return sessionId;
}

function trackPageView(path: string, referrer: string | null) {
  const payload = JSON.stringify({
    eventName: "page_view",
    sessionId: getSessionId(),
    path,
    referrer,
    properties: {
      title: document.title
    }
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics/events", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: payload,
    keepalive: true
  });
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousUrl = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const path = `${pathname}${query ? `?${query}` : ""}`;
    trackPageView(path, previousUrl.current ?? (document.referrer || null));
    previousUrl.current = new URL(path, window.location.origin).toString();
  }, [pathname, searchParams]);

  return null;
}
