/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./*.js",
    "./frontend/**/*.html",
    "./frontend/**/*.js"
  ],
 theme: {
  extend: {
    spacing: {
      '15': '3.75rem',
      '45': '11.25rem',
      '230': '230px',
      '250': '250px'
    }
  }
},

  plugins: [],
}
