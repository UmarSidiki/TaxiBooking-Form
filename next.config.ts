import {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
    // Performance optimizations
    compress: true,
    poweredByHeader: false,
    
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
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};
 
const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');
export default withNextIntl(nextConfig);