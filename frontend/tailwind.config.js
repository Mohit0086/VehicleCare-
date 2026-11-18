/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blue: { 50: '#fbf4ef', 100: '#f3e3d8', 200: '#e6c3b3', 300: '#d69c80', 400: '#c47955', 500: '#b75a35', 600: '#a64225', 700: '#8c371f', 800: '#71301e', 900: '#542b20', 950: '#321a13' },
        primary: '#A64225',
        'primary-dark': '#84341E',
        surface: '#FFFFFF',
        background: '#F4F2ED',
        border: '#E5E7EB',
        ink: '#111827',
        muted: '#6B7280',
        status: { ok: '#166534', 'ok-bg': '#DCFCE7', soon: '#92400E', 'soon-bg': '#FEF3C7', due: '#991B1B', 'due-bg': '#FEE2E2', progress: '#1E40AF', 'progress-bg': '#DBEAFE' },
      },
      borderRadius: { xl: '8px', '2xl': '10px', '3xl': '12px' },
      fontFamily: { sans: ['DM Sans', 'system-ui', 'sans-serif'] },
      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
};
