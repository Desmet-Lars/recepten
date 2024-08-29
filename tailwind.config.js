/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}', // Adjust these paths to match your project structure
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1976d2',
        secondary: '#ff4081',
        textPrimary: '#333',
        textSecondary: '#666',
        bgLight: '#fafafa',
        bgDark: '#f5f5f5',
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px',
        extraLarge: '32px',
      },
    },
  },
  plugins: [],
};
