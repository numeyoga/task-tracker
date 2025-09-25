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
    logs: true,
    rtl: false,
    darkTheme: false
  }
};
