/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Disk-backed webpack cache (PackFileCacheStrategy) under `.next/cache` can desync with hot reload
   * and leave missing `vendor-chunks/*` + 404s on `/_next/static/*` (no CSS/JS). Memory cache in dev
   * avoids those ENOENT / "__webpack_modules__[moduleId] is not a function" failures.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
