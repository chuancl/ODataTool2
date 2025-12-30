import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // 必须使用相对路径且使用正斜杠 '/'，不要使用 path.join，因为 glob 不支持 Windows 的反斜杠
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // 显式绑定 HeroUI 变量
        background: "hsl(var(--heroui-background) / <alpha-value>)",
        foreground: "hsl(var(--heroui-foreground) / <alpha-value>)",
      }
    },
  },
  plugins: [heroui()],
}