/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: '#F8F7F4',
        surface: '#FFFFFF',
        elevated: '#F1F0ED',
        hover: '#EDECEA',
        border: '#E2E0DB',
        'border-light': '#D4D2CD',
        zebra: '#F5F4F1',

        primary: '#1B2A4A',
        secondary: '#4A5568',
        tertiary: '#8896AB',

        accent: {
          DEFAULT: '#E07A5F',
          hover: '#D4694E',
          muted: '#FDF0EC',
          dim: '#FAE5DE',
        },

        'accent-secondary': {
          DEFAULT: '#E8924A',
          hover: '#D67F3A',
          muted: '#FDF3EB',
          dim: '#FAE8D8',
        },

        success: '#2D7A4F',
        'success-muted': '#E8F5EC',
        warning: '#B8860B',
        'warning-muted': '#FEF5E0',
        error: '#C53030',
        'error-muted': '#FDE8E8',
        info: '#3b82f6',

        health: {
          excellent: '#1D7A5E',
          good: '#2D8A4E',
          moderate: '#A87D0A',
          poor: '#C53030',
        },

        trust: {
          high: '#1D7A5E',
          medium: '#B8860B',
          low: '#8896AB',
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
        sm: '4px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(27,42,74,0.04)',
        DEFAULT: '0 1px 3px rgba(27,42,74,0.06), 0 1px 2px rgba(27,42,74,0.04)',
        md: '0 4px 6px rgba(27,42,74,0.06), 0 2px 4px rgba(27,42,74,0.04)',
        lg: '0 10px 15px rgba(27,42,74,0.06), 0 4px 6px rgba(27,42,74,0.04)',
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
        'slide-up': 'slideUp 200ms ease-out',
        // ZK Bridge animation keyframes
        'zk-data-bounce': 'zkDataBounce 6s ease-in-out infinite',
        'zk-receipt-glide': 'zkReceiptGlide 6s ease-in-out infinite',
        'zk-shield-pulse': 'zkShieldPulse 6s ease-in-out infinite',
        'zk-partner-confirm': 'zkPartnerConfirm 6s ease-in-out infinite',
        'zk-hash-appear': 'zkHashAppear 6s ease-in-out infinite',
      },
      keyframes: {
        zkDataBounce: {
          '0%, 100%': { transform: 'translateX(0)', opacity: '1' },
          '12%': { transform: 'translateX(60px)', opacity: '1' },
          '18%': { transform: 'translateX(30px) scale(0.9)', opacity: '0.7' },
          '24%': { transform: 'translateX(0)', opacity: '1' },
          '25%, 100%': { transform: 'translateX(0)', opacity: '1' },
        },
        zkReceiptGlide: {
          '0%, 30%': { transform: 'translateX(0)', opacity: '0' },
          '35%': { transform: 'translateX(0)', opacity: '1' },
          '60%': { transform: 'translateX(110px)', opacity: '1' },
          '65%': { transform: 'translateX(110px)', opacity: '1' },
          '75%, 100%': { transform: 'translateX(110px)', opacity: '0' },
        },
        zkShieldPulse: {
          '0%, 10%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(224,122,95,0)' },
          '15%': { transform: 'scale(1.12)', boxShadow: '0 0 0 8px rgba(224,122,95,0.15)' },
          '22%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(224,122,95,0)' },
          '30%': { transform: 'scale(1.08)', boxShadow: '0 0 0 6px rgba(224,122,95,0.1)' },
          '38%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(224,122,95,0)' },
        },
        zkPartnerConfirm: {
          '0%, 58%': { transform: 'scale(1)', borderColor: 'rgba(226,224,219,1)' },
          '65%': { transform: 'scale(1.08)', borderColor: 'rgba(45,122,79,0.4)' },
          '72%': { transform: 'scale(1)', borderColor: 'rgba(45,122,79,0.2)' },
          '85%, 100%': { transform: 'scale(1)', borderColor: 'rgba(226,224,219,1)' },
        },
        zkHashAppear: {
          '0%, 32%': { opacity: '0', transform: 'translateY(4px)' },
          '38%': { opacity: '1', transform: 'translateY(0)' },
          '70%': { opacity: '1', transform: 'translateY(0)' },
          '78%, 100%': { opacity: '0', transform: 'translateY(4px)' },
        },
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
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
