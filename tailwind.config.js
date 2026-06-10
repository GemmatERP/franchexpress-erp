/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'fe-bg': '#FBFBFB',
        'fe-muted': '#E0E4D6',
        'fe-teal': '#60CAAD',
        'fe-dark': '#444444',
        'fe-gray': '#9DA5A2',
        'fe-softgreen': '#B6CCBB',
        'fe-green': '#A7C7AF',
      },
      fontFamily: {
        heading: ['var(--font-plus-jakarta)', 'sans-serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        'lg': '8px',
        'xl': '12px',
      },
    },
  },
  plugins: [],
}
