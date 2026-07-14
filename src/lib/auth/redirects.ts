const unsafeRedirectPattern = /[\\\u0000-\u001f\u007f]/;

export function resolveSafeRedirect(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || unsafeRedirectPattern.test(value)) {
    return fallback;
  }

  try {
    const url = new URL(value, "https://internal.invalid");

    if (url.origin !== "https://internal.invalid") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
