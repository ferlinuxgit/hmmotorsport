"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { shouldTrackNavigation } from "@/lib/navigation/progress";

type NavigationProgressContextValue = { start: () => void; complete: () => void };
const NavigationProgressContext = createContext<NavigationProgressContextValue | null>(null);

export function NavigationProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchdogTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    hideTimer.current = null;
    watchdogTimer.current = null;
  }, []);

  const complete = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    if (watchdogTimer.current) clearTimeout(watchdogTimer.current);
    watchdogTimer.current = null;
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    activeRef.current = true;
    setVisible(true);
    setProgress((current) => current > 0 && current < 90 ? current : 12);
    watchdogTimer.current = setTimeout(complete, 15_000);
  }, [clearTimers, complete]);

  useEffect(() => {
    if (!visible || !activeRef.current) return;
    const interval = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        const increment = Math.max((90 - current) * 0.12, 1);
        return Math.min(current + increment, 90);
      });
    }, 320);
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      const element = event.target instanceof Element ? event.target.closest("a") : null;
      if (!(element instanceof HTMLAnchorElement)) return;
      if (shouldTrackNavigation({
        href: element.href,
        currentHref: window.location.href,
        button: event.button,
        modified: event.metaKey || event.ctrlKey || event.shiftKey || event.altKey,
        target: element.target,
        download: element.hasAttribute("download"),
        ignored: element.dataset.navigationProgress === "ignore"
      })) start();
    }
    function onPopState() { start(); }
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [clearTimers, start]);

  const value = useMemo(() => ({ start, complete }), [start, complete]);
  return (
    <NavigationProgressContext.Provider value={value}>
      {visible ? (
        <div className="navigation-progress" role="progressbar" aria-label="Cargando nueva página" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
          <div className="navigation-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
          <span className="sr-only">Cargando nueva página</span>
        </div>
      ) : null}
      {children}
    </NavigationProgressContext.Provider>
  );
}

export function NavigationProgressRouteObserver() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { complete } = useNavigationProgress();
  const route = `${pathname}?${searchParams.toString()}`;
  const previousRoute = useRef(route);
  useEffect(() => {
    if (previousRoute.current !== route) {
      previousRoute.current = route;
      complete();
    }
  }, [route, complete]);
  return null;
}

export function useNavigationProgress() {
  const context = useContext(NavigationProgressContext);
  if (!context) throw new Error("useNavigationProgress must be used inside NavigationProgressProvider");
  return context;
}

export function useProgressRouter() {
  const router = useRouter();
  const { start } = useNavigationProgress();
  return useMemo(() => ({
    push(href: string) { start(); router.push(href); },
    replace(href: string) { start(); router.replace(href); },
    back() { start(); router.back(); },
    forward() { start(); router.forward(); },
    refresh() { router.refresh(); }
  }), [router, start]);
}
