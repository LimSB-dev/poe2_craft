import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    // `domains` keeps exact hostname allowlisting (works with `hasRemoteMatch` alongside `remotePatterns`).
    domains: ["www.poe2wiki.net"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.poe2wiki.net",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
