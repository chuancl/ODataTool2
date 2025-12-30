import { heroui } from "@heroui/react";
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

// 动态获取 @heroui/theme 的安装路径，确保能扫描到样式
// 无论是在根目录 node_modules 还是嵌套的 node_modules 都能正常工作
let themePath;
try {
  themePath = path.dirname(require.resolve("@heroui/theme/package.json"));
} catch (e) {
  // 兜底：如果解析失败，使用常规假设路径
  themePath = "./node_modules/@heroui/theme";
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // 扫描动态解析出的路径
    `${themePath}/dist/**/*.{js,ts,jsx,tsx}`,
    // 同时也扫描 react 包，以防万一
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
        background: "hsl(var(--heroui-background) / <alpha-value>)",
        foreground: "hsl(var(--heroui-foreground) / <alpha-value>)",
      }
    },
  },
  plugins: [heroui()],
}