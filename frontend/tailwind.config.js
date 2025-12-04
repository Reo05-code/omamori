/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'warm-brown': {
          '50': '#fbf8f5',
          '100': '#f5eee9',
          '200': '#ebdace',
          '300': '#dfc1b0',
          '400': '#d0a28a',
          '500': '#c4896d',
          '600': '#b47055',
          '700': '#975a45',
          '800': '#7a4a3a',
          '900': '#643e32',
          '950': '#361f19',
        },
        'warm-orange': {
          DEFAULT: '#f97316',
          'light': '#fb923c',
        },
        'warm-bg': '#fef3c7',
        'warm-surface': '#fffbeb',
      },
      fontFamily: {
        display: ["'M PLUS Rounded 1c'", 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
      },
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(180, 112, 85, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
