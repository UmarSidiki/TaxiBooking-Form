import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Geist, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import "@/shared/style/globals.css";
import "@/shared/style/riviera-theme.css";
import "@/shared/style/riviera-palettes.css";
import { resolveColorPalette } from "@/features/settings/lib/color-palettes";
import { customPaletteCss } from "@/features/settings/lib/custom-palette";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthSessionProvider from "@/features/auth/ui/session-provider";
import { routing } from "@/shared/i18n/routing";
import { ThemeProvider } from "@/features/settings/context/theme-context";
import { CurrencyProvider } from "@/shared/context/currency-context";
import { GeoProvider } from "@/features/geo/context/geo-context";
import { getThemeSettings } from "@/features/settings/lib/theme-settings";
import type { ThemeSettings } from "@/features/settings/lib/theme-settings";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const rivieraArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-riviera-arabic",
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? "Booking Form";
const siteDescription =
  "Premium booking experiences for riders, partners, and administrators—ready for any brand.";
const logoPath = "/logo.png";

export async function generateMetadata(): Promise<Metadata> {
  const base = await resolvePublicUrl({ request: await headers() });

  return {
    metadataBase: base ? new URL(base) : undefined,
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: siteDescription,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/icon.png",
    },
    openGraph: {
      title: siteName,
      description: siteDescription,
      url: "/",
      siteName,
      images: [
        {
          url: logoPath,
          width: 512,
          height: 512,
          alt: `${siteName} logo`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description: siteDescription,
      images: [logoPath],
    },
  };
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Theme tokens come from the live settings document; never prerender this layout.
  await connection();

  const themeSettings = await getThemeSettings();
  const serializedThemeSettings = JSON.parse(
    JSON.stringify(themeSettings)
  ) as ThemeSettings;

  const palette = resolveColorPalette(themeSettings.colorPalette);
  // Brand colours come from the palette stylesheet (--sig/--ink); only the radius is set inline.
  const cssVariables = {
    "--border-radius": `${themeSettings.borderRadius}rem`,
  } as CSSProperties;

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-palette={palette}
      suppressHydrationWarning
    >
      <head>
        {/* Preconnect to external services for faster loading */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {palette === "custom" ? (
          <style id="custom-palette" dangerouslySetInnerHTML={{ __html: customPaletteCss(themeSettings.customPalette) }} />
        ) : null}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('riviera-theme');var d=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.rivieraTheme=d;}catch(e){document.documentElement.dataset.rivieraTheme='light';}})();`,
          }}
        />
      </head>
      <body
        style={cssVariables}
        className={`${geistSans.variable} ${geistMono.variable} ${rivieraArabic.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider initialSettings={serializedThemeSettings}>
            <CurrencyProvider>
              <GeoProvider>
                <NextIntlClientProvider>{children}</NextIntlClientProvider>
              </GeoProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
