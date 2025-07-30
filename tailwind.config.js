/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'carmax': {
          'blue': '#0066CC',
          'blue-dark': '#004499',
          'orange': '#FF6600',
          'gray': '#666666',
          'gray-light': '#F5F5F5',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'Proxima Nova', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'carmax': '8px',
      },
      boxShadow: {
        'carmax': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'carmax-lg': '0 4px 16px rgba(0, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
} 