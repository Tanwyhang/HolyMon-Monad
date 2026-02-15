import type { NextConfig } from "next";
import { webpack } from "next/dist/compiled/webpack/webpack";

const nextConfig: NextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
  turbopack: {},
  webpack: (config) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
      // Ignore the elizaos directory using checkResource
      new webpack.IgnorePlugin({
        checkResource(resource, context) {
          // Ignore anything within the elizaos directory
          return /elizaos\//.test(context);
        },
      }),
      new webpack.NormalModuleReplacementPlugin(
        /^lit$/,
        require.resolve('lit')
      ),
      new webpack.NormalModuleReplacementPlugin(
        /^lit-element$/,
        require.resolve('lit-element')
      ),
    );
    // Return modified config
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          'lit': require.resolve('lit'),
          'lit-element': require.resolve('lit-element'),
          'lit-html': require.resolve('lit-html'),
          '@lit/reactive-element': require.resolve('@lit/reactive-element'),
        },
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
          async_hooks: false,
          worker_threads: false,
        },
      },
      optimization: {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            lit: {
              test: /[\\/]node_modules[\\/](lit|lit-element|lit-html|@lit)[\\/]/,
              name: 'lit',
              priority: 20,
              reuseExistingChunk: true,
            },
          },
        },
      },
      externals: [
        ...config.externals,
        '@codemirror/autocomplete',
        '@codemirror/commands',
        '@codemirror/language',
        '@codemirror/lang-markdown',
        '@codemirror/lang-sql',
        '@codemirror/legacy-modes',
        '@codemirror/lint',
        '@codemirror/search',
        '@codemirror/state',
        '@codemirror/view',
        'ai',
        '@ai-sdk/groq',
        'js-tiktoken',
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/start",
        destination: "https://ai.eliza.how/eliza/",
        permanent: false,
      },
      {
        source: "/school",
        destination:
          "https://www.youtube.com/playlist?list=PL0D_B_lUFHBKZSKgLlt24RvjJ8pavZNVh",
        permanent: false,
      },
      {
        source: "/discord",
        destination: "https://discord.gg/2bkryvK9Yu",
        permanent: false,
      },
      {
        source: "/profiles",
        destination: "https://elizaos.github.io/profiles",
        permanent: false,
      },
      {
        source: "/bounties",
        destination: "https://elizaos.github.io/website/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path(.*)",
        destination: "https://us-assets.i.posthog.com/static/:path",
      },
      {
        source: "/ingest/:path(.*)",
        destination: "https://us.i.posthog.com/:path",
      },
      {
        source: "/profiles/:path(.*)",
        destination: "https://elizaos.github.io/profiles/:path",
      },
      {
        source: "/bounties/:path(.*)",
        destination: "https://elizaos.github.io/website/:path",
      },
      {
        source: "/eliza/:path(.*)",
        destination: "https://elizaos.github.io/eliza/:path",
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
