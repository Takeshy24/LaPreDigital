/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#12375E',
        institutional: '#135295',
        bright: '#255EE2',
        orange: '#F7A112',
        'orange-deep': '#E37110',
        ice: '#F6F7F8'
      }
    }
  },
  plugins: []
};
