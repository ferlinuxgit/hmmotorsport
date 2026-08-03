export interface NavigationIntent {
  href: string;
  currentHref: string;
  button: number;
  modified: boolean;
  target?: string | null;
  download?: boolean;
  ignored?: boolean;
}

export function shouldTrackNavigation(intent: NavigationIntent) {
  if (intent.button !== 0 || intent.modified || intent.download || intent.ignored) return false;
  if (intent.target && intent.target.toLowerCase() !== "_self") return false;
  try {
    const current = new URL(intent.currentHref);
    const destination = new URL(intent.href, current);
    if (!["http:", "https:"].includes(destination.protocol) || destination.origin !== current.origin) return false;
    return `${destination.pathname}${destination.search}` !== `${current.pathname}${current.search}`;
  } catch {
    return false;
  }
}
