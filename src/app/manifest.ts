import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

import { getThemeSettings } from '@/features/settings/lib/theme-settings'

export const dynamic = 'force-dynamic'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const theme = await getThemeSettings()
  // The saved brand is the app's name and icon; the database is the only
  // source, so an empty name stays empty rather than inventing one.
  const siteName = theme.companyName?.trim() ?? "";
  const siteDescription = "Premium booking experiences for riders, partners, and administrators.";

  // Auto-detect shortcuts from (pages) directory
  const pagesDir = path.join(process.cwd(), 'src/app/[locale]/(pages)');
  let shortcuts: MetadataRoute.Manifest['shortcuts'] = [];

  try {
    if (fs.existsSync(pagesDir)) {
      const pages = fs.readdirSync(pagesDir).filter(file => {
        return fs.statSync(path.join(pagesDir, file)).isDirectory();
      });

      shortcuts = pages.map(page => ({
        name: page.charAt(0).toUpperCase() + page.slice(1),
        short_name: page.charAt(0).toUpperCase() + page.slice(1),
        description: `Access ${page} portal`,
        url: `/${page}`,
        icons: [{ src: '/icon', sizes: 'any' }],
      }));
    }
  } catch (error) {
    console.error('Error generating shortcuts:', error);
  }

  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,

    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: 'any',
        purpose: 'any',
      },
    ],
    shortcuts: shortcuts.length > 0 ? shortcuts : undefined,
  }
}
