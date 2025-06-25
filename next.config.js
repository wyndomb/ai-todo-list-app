/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer, webpack }) => {
    // Fix for Supabase WebSocket dependencies
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        bufferutil: false,
        "utf-8-validate": false,
      };
    }

    // Ignore optional dependencies that cause warnings
    config.externals = config.externals || [];
    config.externals.push({
      bufferutil: "bufferutil",
      "utf-8-validate": "utf-8-validate",
    });

    // Suppress specific warnings
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /\/node_modules\/@supabase\/realtime-js\//,
        (data) => {
          delete data.dependencies[0].critical;
          return data;
        }
      )
    );

    // Ignore warnings for these specific modules
    config.ignoreWarnings = [
      {
        module: /node_modules\/@supabase\/realtime-js/,
      },
      {
        message:
          /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
