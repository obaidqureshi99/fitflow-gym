import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17181f', panel: '#22242d', raise: '#2a2c36', line: '#353743',
        brand: { DEFAULT: '#ff6a00', soft: '#ff8a3d' }, muted: '#8b8d9a',
        good: '#2ecc71', warn: '#f5b301', bad: '#ff4d5e',
      },
      fontFamily: { sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
