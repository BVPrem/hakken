"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // nonce="" satisfies React 19's expectation that any script-injecting
    // provider declares an explicit nonce. The warning is dev-only and
    // non-breaking; nonce="" is the recommended mitigation per next-themes docs.
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      nonce=""
    >
      {children}
    </NextThemesProvider>
  );
}