/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#0d1117',
          darker: '#0a0d12',
          light: '#ffffff',
        },
        edge: 'rgba(148, 163, 184, 0.16)',
        status: {
          ok: '#22c55e',
          warn: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        ui: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}