import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Jaring pengaman untuk form yang mengirim file lewat Server Action
      // (mis. onboarding). Default Next hanya 1 MB, padahal logo boleh 2 MB.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
