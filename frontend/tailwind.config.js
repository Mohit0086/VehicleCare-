/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8',
        'primary-dark': '#1E40AF',
        surface: '#FFFFFF',
        background: '#F3F4F6',
        border: '#E5E7EB',
        ink: '#111827',
        muted: '#6B7280',
        status: { ok: '#166534', 'ok-bg': '#DCFCE7', soon: '#92400E', 'soon-bg': '#FEF3C7', due: '#991B1B', 'due-bg': '#FEE2E2', progress: '#1E40AF', 'progress-bg': '#DBEAFE' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      maxWidth: { content: '1200px' },
    },
  },
  plugins: [],
};
