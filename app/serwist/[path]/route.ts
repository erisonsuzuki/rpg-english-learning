import { createSerwistRoute } from "@serwist/turbopack";
import appVersion from "@/app-version.json";

const revision = appVersion.version;

export const {
  dynamic,
  dynamicParams,
  revalidate,
  generateStaticParams,
  GET,
} = createSerwistRoute({
  additionalPrecacheEntries: [{ url: "/offline", revision }],
  swSrc: "app/sw.ts",
  nextConfig: {},
});
