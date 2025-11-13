import type { CSSProperties } from "react";
import type { Metadata } from "next";
import "@/style/globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import AuthSessionProvider from "@/components/providers/session-provider";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { getThemeSettings } from "@/lib/theme-settings";
import type { ThemeSettings } from "@/lib/theme-settings";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_WEBSITE_NAME,
  description: "Created by UmarSidiki | Linkedin: https://www.linkedin.com/in/umarsidiki/",
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
    <html lang={locale}>
      <body
        style={cssVariables}
        className="antialiased"
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
