import { MetadataRoute } from 'next'
import fs from 'fs'
import path from 'path'

export default function manifest(): MetadataRoute.Manifest {
  const siteName = process.env.NEXT_PUBLIC_WEBSITE_NAME ?? "Booking Service";
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
        icons: [{ src: '/icon.png', sizes: '192x192' }],
      }));
    }
  } catch (error) {
    console.error('Error generating shortcuts:', error);
  }

  return {
    name: siteName,
    short_name: siteName,
    description: siteDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: shortcuts.length > 0 ? shortcuts : undefined,
  }
}
