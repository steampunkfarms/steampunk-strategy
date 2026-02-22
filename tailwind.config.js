/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // The Bridge — TARDIS Control Room Palette
        // Deep blues + brass instruments + time-worn parchment
        tardis: {
          DEFAULT: '#003B6F',  // TARDIS blue — primary accent
          light:   '#1A5A8A',  // lighter blue for hover states
          dark:    '#002347',  // deep blue for sidebar bg
          glow:    '#4DA8DA',  // temporal glow — active indicators
          dim:     '#0A2540',  // darkest — page bg
        },
        console: {
          DEFAULT: '#1B2A3D',  // control panel surface
          light:   '#243B53',  // card backgrounds
          border:  '#2D4A6A',  // panel borders
          hover:   '#1E3451',  // row/card hover
        },
        brass: {
          DEFAULT: '#C4AD8A',  // instrument bezels, dividers
          gold:    '#D4A842',  // active states, important indicators
          dark:    '#8B6328',  // high-emphasis badges
          muted:   '#A89878',  // secondary text, timestamps
          warm:    '#B8A88A',  // tertiary text
        },
        gauge: {
          green:   '#4ADE80',  // all clear, healthy, on-time
          amber:   '#FBBF24',  // warning, approaching deadline
          red:     '#F87171',  // overdue, critical, alert
          blue:    '#60A5FA',  // informational
        },
        // Inherited from Studiolo for continuity
        parchment: {
          DEFAULT: '#E3D4B7',
          light:   '#F5EDE0',
          dark:    '#D6C4A4',
        },
        walnut: {
          DEFAULT: '#2E1E0E',
          light:   '#4A3520',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan-line': 'scan-line 4s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
