/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  serverExternalPackages: ["esbuild-wasm"],
};

module.exports = nextConfig;
