/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#0A192F',
        'navy-light': '#112240',
        'navy-lighter': '#233554',
      }
    },
  },
  plugins: [],
}
