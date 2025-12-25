export interface CodeSplittingConfig {
  vendor: string[];
  commons: string[];
  minSize: number;
  maxSize: number;
}

export const CODE_SPLITTING_STRATEGY: CodeSplittingConfig = {
  vendor: ['react', 'react-dom', '@supabase/supabase-js'],
  commons: ['@/lib', '@/hooks'],
  minSize: 20000,
  maxSize: 244000,
};

export function optimizeChunks() {
  return {
    splitChunks: {
      chunks: 'all' as const,
      cacheGroups: {
        vendor: {
          test: /[\/]node_modules[\/](react|react-dom|@supabase)[\/]/,
          name: 'vendor',
          priority: 10,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
  };
}

export function analyzeBundleSize() {
  return {
    warnings: {
      maxAssetSize: CODE_SPLITTING_STRATEGY.maxSize,
      maxEntrypointSize: CODE_SPLITTING_STRATEGY.maxSize,
    },
  };
}
