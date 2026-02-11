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
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);