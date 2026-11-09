const brandScale = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#10b981',
  400: '#10b981',
  500: '#059669',
  600: '#059669',
  700: '#047857',
  800: '#064e3b',
  900: '#064e3b',
  950: '#091a42'
};

const neutralScale = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617'
};

const blueScale = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#93c5fd',
  300: '#93c5fd',
  400: '#2563eb',
  500: '#2563eb',
  600: '#2563eb',
  700: '#2563eb',
  800: '#2563eb',
  900: '#2563eb',
  950: '#091a42'
};

const tealScale = {
  50: '#f0fdfa',
  100: '#f0fdfa',
  200: '#0d9488',
  300: '#0d9488',
  400: '#0d9488',
  500: '#0d9488',
  600: '#0d9488',
  700: '#15998d',
  800: '#15998d',
  900: '#091a42',
  950: '#091a42'
};

const orangeScale = {
  50: '#fff7ed',
  100: '#fff7ed',
  200: '#f97316',
  300: '#f97316',
  400: '#f97316',
  500: '#f97316',
  600: '#ea580c',
  700: '#ea580c',
  800: '#ea580c',
  900: '#091a42',
  950: '#091a42'
};

const violetScale = {
  50: '#f5f3ff',
  100: '#f5f3ff',
  200: '#7c3aed',
  300: '#7c3aed',
  400: '#7c3aed',
  500: '#7c3aed',
  600: '#7c3aed',
  700: '#7c3aed',
  800: '#091a42',
  900: '#091a42',
  950: '#091a42'
};

const dangerScale = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#b91c1c',
  500: '#dc2626',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#b91c1c',
  900: '#b91c1c',
  950: '#020617'
};

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        brand: brandScale,
        indigo: brandScale,
        emerald: brandScale,
        green: brandScale,
        slate: neutralScale,
        gray: neutralScale,
        blue: blueScale,
        sky: blueScale,
        teal: tealScale,
        cyan: tealScale,
        amber: orangeScale,
        orange: orangeScale,
        yellow: orangeScale,
        violet: violetScale,
        purple: violetScale,
        rose: dangerScale,
        red: dangerScale,
        white: '#ffffff',
        black: '#020617',
        ink: '#091a42'
      }
    }
  },
  plugins: []
};
