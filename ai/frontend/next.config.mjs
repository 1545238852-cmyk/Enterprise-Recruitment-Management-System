const backendApiBase = (process.env.INTERNAL_API_BASE_URL || 'http://127.0.0.1:8001/api').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendApiBase}/:path*`,
      },
    ]
  },
}

export default nextConfig
