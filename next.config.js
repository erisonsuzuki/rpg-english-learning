/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  cacheComponents: true,
  serverExternalPackages: ["esbuild-wasm"],
  output: "standalone",
};

module.exports = nextConfig;
