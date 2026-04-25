export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        ink: '#111827',
        skyglass: '#e0f2fe',
        coral: '#fb7185',
        mint: '#34d399'
      }
    }
  },
  plugins: []
};
