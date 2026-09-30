/** @type {import('tailwindcss').Config} */
// Tokens de Educraft XYZ: los neutros y los tonos suaves salen de
// variables CSS (ver index.css) para que el tema claro/oscuro cambie
// sin tocar clases. Los acentos usan la paleta pastel del diseño.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        app: 'var(--bg-app)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        line: 'var(--border)',
        ink: {
          DEFAULT: 'var(--text)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
        soft: {
          pink: 'var(--soft-pink)',
          purple: 'var(--soft-purple)',
          blue: 'var(--soft-blue)',
          orange: 'var(--soft-orange)',
          yellow: 'var(--soft-yellow)',
          green: 'var(--soft-green)',
          red: 'var(--soft-red)',
          sky: 'var(--soft-sky)',
        },
        brand: {
          pink: '#ec4899',
          purple: '#8b5cf6',
          blue: '#3b82f6',
          orange: '#f97316',
          yellow: '#f59e0b',
          green: '#22c55e',
          red: '#ef4444',
          sky: '#0ea5e9',
        },
      },
      borderRadius: {
        card: '1.25rem',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'none' } },
        'slide-in': { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(.97)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        'fade-in': 'fade-in .18s ease-out',
        'slide-in': 'slide-in .25s cubic-bezier(.2,.8,.2,1)',
        'pop-in': 'pop-in .16s ease-out',
      },
    },
  },
  plugins: [],
}
