/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb', // Large uploads: scanned documents, bank statements
    },
  },
};

module.exports = nextConfig;
