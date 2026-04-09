module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@listingUrlCore': './supabase/functions/_shared/listingUrlCore.ts',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json', '.png'],
        },
      ],
    ],
  };
};
