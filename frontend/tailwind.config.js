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
        background: '#090d16',
        surface: '#111827',
        'surface-border': '#1f293d',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#0f172a',
          900: '#090d16',
        },
      },
    },
  },
  plugins: [],
};
