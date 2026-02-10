/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#0a0b0d',
        surface: '#111318',
        elevated: '#161920',
        hover: '#1c1f2a',
        border: '#1e2230',
        'border-light': '#2a2f3e',
        zebra: '#0f1015',

        primary: '#e2e4e9',
        secondary: '#8b8fa3',
        tertiary: '#5c6070',

        accent: {
          DEFAULT: '#4ca5ff',
          hover: '#6ab5ff',
          muted: '#1a3a5c',
          dim: '#0d2240',
        },

        success: '#2d8a5e',
        'success-muted': '#1a3d2e',
        warning: '#c4960a',
        'warning-muted': '#3d3010',
        error: '#c44040',
        'error-muted': '#3d1a1a',
        info: '#3b82f6',

        health: {
          excellent: '#2d8a6e',
          good: '#3d9a5e',
          moderate: '#b8900a',
          poor: '#b04040',
        },

        reputation: {
          diamond: '#7c6bc4',
          platinum: '#5a6acf',
          gold: '#c4920a',
          silver: '#7a7e8f',
          bronze: '#a06828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.9375rem' }],
        xs: ['0.75rem', { lineHeight: '1.0625rem' }],
        sm: ['0.8125rem', { lineHeight: '1.125rem' }],
        base: ['0.875rem', { lineHeight: '1.25rem' }],
        lg: ['0.9375rem', { lineHeight: '1.3125rem' }],
        xl: ['1.0625rem', { lineHeight: '1.4375rem' }],
        '2xl': ['1.3125rem', { lineHeight: '1.6875rem' }],
        '3xl': ['1.5625rem', { lineHeight: '1.9375rem' }],
        '4xl': ['2.125rem', { lineHeight: '2.375rem' }],
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        none: 'none',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-in': 'slideIn 150ms ease-out',
        'flow-pulse': 'flowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'node-appear': 'nodeAppear 400ms ease-out forwards',
        'count-up': 'countUp 300ms ease-out',
        'hash-reveal': 'hashReveal 600ms steps(20) forwards',
        'proof-step': 'proofStep 500ms ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flowPulse: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        nodeAppear: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        countUp: {
          '0%': { opacity: '0.5', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        hashReveal: {
          '0%': { maxWidth: '0', opacity: '0' },
          '100%': { maxWidth: '100%', opacity: '1' },
        },
        proofStep: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
