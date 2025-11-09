import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  outputFileTracingIncludes: {
    '/(chat)': ['./src/app/(chat)/**/*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
