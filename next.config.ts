import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/auth/signin",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/auth/signup",
        destination: "/sign-up",
        permanent: true,
      },
      {
        source: "/auth/sign-in",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/auth/sign-up",
        destination: "/sign-up",
        permanent: true,
      },
      {
        source: "/login",
        destination: "/sign-in",
        permanent: true,
      },
      {
        source: "/register",
        destination: "/sign-up",
        permanent: true,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/**/*": ["./lib/generated/prisma/**/*"],
    "/(dashboard)/**/*": ["./lib/generated/prisma/**/*"], // Add other route groups as needed
  },
};

export default nextConfig
