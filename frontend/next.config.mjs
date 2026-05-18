/** @type {import('next').NextConfig} */
const nextConfig = {
  // `npm run dev` uses Turbopack (see package.json). Avoid custom webpack() hooks here —
  // they still apply to parts of the dev toolchain and can interact badly with a stale `.next`.
};

export default nextConfig;
