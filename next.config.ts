import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    devIndicators: false,
    
    // Enable React optimizations
    reactStrictMode: true,
    
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**", // This allows all HTTPS domains
            },
            {
                protocol: "http",
                hostname: "**", // This allows all HTTP domains (use with caution)
            },
        ],
    },
    
    // Experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
    },
    serverExternalPackages: ['@whiskeysockets/baileys', 'qrcode', 'pino', '@react-pdf/renderer'],
    async redirects() {
        return [
            // Browsers that ask for /favicon.ico by habit get the saved logo.
            { source: "/favicon.ico", destination: "/icon", permanent: false },
        ];
    },
    async rewrites() {
        return [
            { source: "/api/calendar/:token.ics", destination: "/api/calendar/:token" },
        ];
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
                    // Nothing in this app is meant to be framed, and the ops
                    // sign-in must not be frameable at all.
                    { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
                ],
            },
            {
                // The embeddable widget is the one page that exists to be
                // framed by partner sites, so it opts out of the block above.
                source: "/:locale/embeddable/:path*",
                headers: [
                    { key: "Content-Security-Policy", value: "frame-ancestors *" },
                ],
            },
        ];
    },
};
 
const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');
export default withNextIntl(nextConfig);