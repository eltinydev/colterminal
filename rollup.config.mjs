import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'index.js', // Where your shebang and requires are
  output: {
    file: 'dist/index.js',
    format: 'cjs', // Keeps the final bundle as CommonJS
    sourcemap: true
  },
  plugins: [
    commonjs() // This is the engine that pulls in ./lib/colors.js and ./lib/launcher.js
  ]
};
