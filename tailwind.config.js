/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: {
            DEFAULT: 'rgb(var(--c-surface) / <alpha-value>)',
            hover: 'rgb(var(--c-surface-hover) / <alpha-value>)',
        },
        border: {
            DEFAULT: 'rgb(var(--c-border) / <alpha-value>)',
            main: 'rgb(var(--c-border) / <alpha-value>)',
        },
        text: {
            main: 'rgb(var(--c-text-main) / <alpha-value>)',
            muted: 'rgb(var(--c-text-muted) / <alpha-value>)',
        },
        brand: {
            DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)',
            hover: 'rgb(var(--c-brand-hover) / <alpha-value>)',
            fg: 'rgb(var(--c-brand-fg) / <alpha-value>)',
        },
        syntax: {
            key: 'rgb(var(--c-syn-key) / <alpha-value>)',
            str: 'rgb(var(--c-syn-str) / <alpha-value>)',
            num: 'rgb(var(--c-syn-num) / <alpha-value>)',
            bool: 'rgb(var(--c-syn-bool) / <alpha-value>)',
            tag: 'rgb(var(--c-syn-tag) / <alpha-value>)',
            attr: 'rgb(var(--c-syn-attr) / <alpha-value>)',
            comment: 'rgb(var(--c-syn-comment) / <alpha-value>)',
        }
      },
    },
  },
  plugins: [],
}