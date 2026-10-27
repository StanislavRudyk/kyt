module.exports = {
  content: ['./*.html', './src/**/*.jsx'],
  theme: {
    extend: {
      colors: { bg: '#0a0a0a', gold: 'var(--gold)', muted: '#8A8A8A' },
      fontFamily: { body: ['Inter', 'system-ui', 'sans-serif'], display: ['"Oswald"', 'sans-serif'] },
      borderRadius: { DEFAULT: '2px' },
    },
  },
  plugins: [],
};
