/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // colors: {
      //   gray: {
      //     50:  '#f9fafb',
      //     100: '#f3f4f6',
      //     200: '#e5e7eb',
      //     300: '#d1d5db',
      //     400: '#9ca3af',
      //     500: '#6b7280',
      //     600: '#4b5563',
      //     700: '#374151',
      //     800: '#1f2937',
      //     900: '#111827',
      //   },
      // },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
    },
  },
  plugins: [],
}