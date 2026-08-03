import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17213a',
        accent: '#2563eb',
        booking: '#dff5e3',
      },
      boxShadow: {
        soft: '0 10px 35px rgba(35, 55, 85, 0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config;
