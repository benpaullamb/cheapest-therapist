/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bacpweblive.blob.core.windows.net',
        port: '',
        pathname: '/profileimage/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bacp.co.uk',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
