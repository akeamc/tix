const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./crates/**/*.{rs,html,css}",
    "./src/**/*.{rs,html,css}",
    "./dist/**/*.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        "mono": ["\"IBM Plex Mono\"", ...defaultTheme.fontFamily.mono],
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
