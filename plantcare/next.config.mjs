/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow server-side pg module usage
  serverExternalPackages: ['pg', 'bcryptjs'],
  // Experimental features
  experimental: {
    // Allow sharp for image optimization
  },
};

export default nextConfig;
