/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#111827',
          card: '#1f2937',
          input: '#0d1117',
          border: '#374151',
          primary: '#4f46e5',
          text: '#e5e7eb',
          muted: '#6b7280',
          success: '#059669',
          danger: '#dc2626',
          warning: '#f59e0b'
        }
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.22)'
      },
      animation: {
        pop: 'pop 180ms ease-out'
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.98)', opacity: 0.8 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        }
      }
    }
  },
  plugins: []
};
