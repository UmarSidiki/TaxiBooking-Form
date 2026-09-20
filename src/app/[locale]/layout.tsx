import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Franklin } from "next/font/google";
import "@/shared/style/globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthSessionProvider from "@/features/auth/ui/session-provider";
import { routing } from "@/shared/i18n/routing";
import { ThemeProvider } from "@/features/settings/context/theme-context";
import { CurrencyProvider } from "@/shared/context/currency-context";
import { getThemeSettings } from "@/features/settings/lib/theme-settings";
import type { ThemeSettings } from "@/features/settings/lib/theme-settings";

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

const deskSans = Libre_Franklin({
  variable: "--font-desk-sans",
  subsets: ["latin"],
  display: "swap",
});

const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? "Booking Form";
const siteDescription =
  "Premium booking experiences for riders, partners, and administrators—ready for any brand.";
const appUrl = process.env.NEXT_PUBLIC_BASE_URL;
const metadataBase = appUrl ? new URL(appUrl) : undefined;
const logoPath = "/logo.png";

export const metadata: Metadata = {
  metadataBase,
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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const themeSettings = await getThemeSettings();
  const serializedThemeSettings = JSON.parse(
    JSON.stringify(themeSettings)
  ) as ThemeSettings;

  const cssVariables = {
    "--primary-color": themeSettings.primaryColor,
    "--secondary-color": themeSettings.secondaryColor,
    "--border-radius": `${themeSettings.borderRadius}rem`,
  } as CSSProperties;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        {/* Preconnect to external services for faster loading */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        style={cssVariables}
        className={`${geistSans.variable} ${geistMono.variable} ${deskSans.variable} antialiased`}
      >
        <AuthSessionProvider>
          <ThemeProvider initialSettings={serializedThemeSettings}>
            <CurrencyProvider>
              <NextIntlClientProvider>{children}</NextIntlClientProvider>
            </CurrencyProvider>
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
