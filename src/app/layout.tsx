import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APEX-Root · 16 层深度 Root 检测系统",
  description: "专业级 Android 设备完整性评估工具 — 16 层深度检测 · 3 模式隐藏 · 后量子签名",
  keywords: ["APEX-Root", "Root检测", "Magisk", "KernelSU", "APatch", "Android安全", "eBPF"],
  authors: [{ name: "MJH" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning style={{ backgroundColor: '#0a0810' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#0a0810', color: '#f8f8f8', minHeight: '100vh' }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
