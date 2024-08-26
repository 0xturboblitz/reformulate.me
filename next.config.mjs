/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  env: {
    GPT_API_KEY: process.env.GPT_API_KEY,
    CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  },
};

export default nextConfig;