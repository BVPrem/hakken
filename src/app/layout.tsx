import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Space_Grotesk, Bebas_Neue } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export const metadata: Metadata = {
  title: "Hakken — Anime & Manga Intelligence",
  description:
    "Discover, track, and explore anime and manga with real-time community intelligence.",
  keywords: ["anime", "manga", "tracker", "recommendations", "community"],
  authors: [{ name: "Hakken" }],
  openGraph: {
    title: "Hakken",
    description: "The intelligence layer for the anime community",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{ baseTheme: dark }}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html
        lang="en"
        suppressHydrationWarning
        className={`${spaceGrotesk.variable} ${bebasNeue.variable}`}
      >
        <body>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
