/**
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D3B2E',
        secondary: '#D97706',
        tertiary: '#1E5E4B',
        surface: '#F8FAFC',
        'surface-container-low': '#E0E3E5',
        'surface-container': '#ECEEF0',
        'surface-container-high': '#E6E8EA',
        background: '#F8FAFC',
        'on-surface': '#0F172A',
        'on-surface-variant': '#64748B',
        'on-primary': '#FFFFFF',
        'on-primary-container': '#79A694',
        'on-secondary': '#FFFFFF',
        'on-secondary-container': '#663500',
        gray: {
          50: '#F7F9FB',
          100: '#EDEFF3',
          200: '#D8DADC',
          300: '#C6C9CD',
          400: '#B5B9BE',
          500: '#A3A9AF',
          600: '#91989F',
          700: '#7F878E',
          800: '#6D777E',
          900: '#5C6573',
          950: '#43525B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      spacing: {
        gutter: '1.5rem',
        'gutter-mobile': '1rem',
        margin: '2rem',
        'margin-mobile': '1rem',
      },
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      shadows: {
        'elevation-card': '0 4px 20px -2px rgba(13, 59, 46, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'elevation-primary': '0 8px 16px -4px rgba(217, 119, 6, 0.35)',
      },
    },
  },
  plugins: [],
};
