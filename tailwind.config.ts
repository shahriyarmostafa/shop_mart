import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1B2A4A',
          50: '#EEF1F6',
          100: '#D6DCE9',
          200: '#AEB9D2',
          300: '#8695BB',
          400: '#5E71A3',
          500: '#3A4E85',
          600: '#28396A',
          700: '#1B2A4A',
          800: '#141F38',
          900: '#0D1526',
        },
        marigold: {
          DEFAULT: '#E8A020',
          50: '#FDF4E3',
          100: '#FAE7C2',
          200: '#F5D08A',
          300: '#F0B851',
          400: '#E8A020',
          500: '#C9840F',
          600: '#A3690C',
        },
        spice: {
          DEFAULT: '#C1440E',
          600: '#A2380B',
        },
        paper: '#FAF7F2',
        leaf: '#2F6D4F',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,42,74,0.06), 0 4px 12px rgba(27,42,74,0.06)',
      },
      clipPath: {
        tag: 'polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
