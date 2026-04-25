/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        digimon: {
          orange: '#FF9500',
          yellow: '#FFCC00',
          blue: '#007AFF',
        }
      },
      fontFamily: {
        retro: ['"Press Start 2P"', 'cursive'],
      }
    },
  },
  plugins: [],
}
