/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}', './index.html'],
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: ['bumblebee'],
    base: true,
    utils: true,
    logs: false,
    rtl: false,
    darkTheme: false
  },
  safelist: [
    // Ensure these classes are included in build
    'shadow-lg',
    'shadow-xl',
    'drop-shadow-lg',
    'outline-primary',
    'outline-2',
    'outline-offset-2',
    'shadow-sm',
    'bg-base-200',
    'bg-base-100',
    'bg-base-300',
    'text-base-content',
    'border-base-300'
  ]
};
