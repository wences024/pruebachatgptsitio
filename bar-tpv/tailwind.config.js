/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#111827',
          card: '#1f2937',
          input: '#0d1117',
        },
        border: {
          DEFAULT: '#374151',
        },
        brand: {
          violet: '#4f46e5',
          'violet-hover': '#4338ca',
          green: '#059669',
          'green-hover': '#047857',
          red: '#dc2626',
          'red-hover': '#b91c1c',
          orange: '#f59e0b',
        },
        text: {
          primary: '#e5e7eb',
          secondary: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
