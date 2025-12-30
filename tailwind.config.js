import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // HeroUI (NextUI) 标准配置路径
    // 扫描 node_modules 下的 theme 包以生成样式
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // 绑定 HeroUI 的 CSS 变量
        background: "hsl(var(--heroui-background) / <alpha-value>)",
        foreground: "hsl(var(--heroui-foreground) / <alpha-value>)",
      }
    },
  },
  plugins: [heroui()],
}