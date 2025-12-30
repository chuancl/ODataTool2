import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // NextUI 标准配置路径
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // 绑定 NextUI 的 CSS 变量 (NextUI 默认使用 --nextui-background 等)
        background: "hsl(var(--nextui-background) / <alpha-value>)",
        foreground: "hsl(var(--nextui-foreground) / <alpha-value>)",
      }
    },
  },
  plugins: [nextui()],
}