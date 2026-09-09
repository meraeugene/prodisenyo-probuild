/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    // Keep visited and prefetched dashboard routes in the client router cache.
    // Server actions still invalidate affected routes through revalidatePath.
    staleTimes: {
      dynamic: 900,
      static: 900,
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = nextConfig;
