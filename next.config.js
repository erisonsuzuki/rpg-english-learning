/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  proxy: {
    matcher: [
      "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
    ],
  },
};

module.exports = nextConfig;
