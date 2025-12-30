import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [nextui({
    themes: {
      light: {
        layout: {
          hoverOpacity: 0.8, // 鼠标悬停时的透明度
          dividerWeight: "1px", // 分割线粗细
          disabledOpacity: 0.5,
          radius: {
            small: "6px",
            medium: "10px",
            large: "14px",
          },
          borderWidth: {
            small: "1px",
            medium: "2px",
            large: "3px",
          },
        },
        colors: {
          background: "#F9FAFB", // 稍微带点灰的白，护眼且显层次
          foreground: "#111827",
          divider: "rgba(17, 24, 39, 0.15)", // 加深亮色模式下的分割线颜色
          content1: "#FFFFFF", // 卡片背景纯白
          content2: "#F3F4F6", // 次级背景
          content3: "#E5E7EB",
          content4: "#D1D5DB",
        },
      },
      dark: {
        layout: {
          hoverOpacity: 0.9,
          dividerWeight: "1px",
        },
        colors: {
          background: "#000000",
          foreground: "#ECEDEE",
          content1: "#18181B", // Zinc 900
          content2: "#27272A", // Zinc 800
          content3: "#3F3F46",
          content4: "#52525B",
        },
      },
    },
  })],
}