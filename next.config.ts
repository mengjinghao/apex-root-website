import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  
  
  basePath: '/apex-root-website',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
