import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "nutritracker-plum.vercel.app" }],
        destination: "https://nutritracker.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
