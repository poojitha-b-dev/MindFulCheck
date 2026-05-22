/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#C0DFFF',
          300: '#94C6FF',
          400: '#5BA6F9',
          500: '#4A90E2', // Primary blue
          600: '#3B78D6',
          700: '#2C5EBF',
          800: '#234A99',
          900: '#1A3A75',
        },
        secondary: {
          50: '#EDFCF5',
          100: '#D7F9E9',
          200: '#AFF2D3',
          300: '#7EE5B7',
          400: '#50C878', // Calming green
          500: '#38B05E',
          600: '#2A944A',
          700: '#216E3A',
          800: '#1B5730',
          900: '#153F24',
        },
        accent: {
          50: '#F6F2FC',
          100: '#EBE3F9',
          200: '#D9C9F2',
          300: '#C1A8E9',
          400: '#B19CD9', // Gentle purple
          500: '#9A7ECF',
          600: '#7F61B7',
          700: '#644A92',
          800: '#4D3870',
          900: '#382853',
        },
        success: {
          500: '#22C55E',
        },
        warning: {
          500: '#F59E0B',
        },
        error: {
          500: '#EF4444',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};