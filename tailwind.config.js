import { heroui } from "@heroui/react";
import path from "path";

// 获取项目根目录的绝对路径
const rootDir = process.cwd();

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // 使用绝对路径，确保 WXT/Vite 能够正确找到文件
    path.join(rootDir, "entrypoints/**/*.{html,ts,tsx}"),
    path.join(rootDir, "components/**/*.{ts,tsx}"),
    // 扫描 HeroUI 的主题文件
    path.join(rootDir, "node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"),
    // 扫描 HeroUI 的 React 组件文件 (涵盖所有子组件)
    path.join(rootDir, "node_modules/@heroui/react/dist/**/*.{js,ts,jsx,tsx}"),
    // 备用：扫描单独安装的子包 (如 @heroui/navbar 等)
    path.join(rootDir, "node_modules/@heroui/*/dist/**/*.{js,ts,jsx,tsx}")
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