/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Enable static export
  distDir: '../griply/static', // Output to griply/static/
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,        // Required for static export
  },
  trailingSlash: true,        // Better for static hosting
}

export default nextConfig
