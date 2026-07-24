import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer 360 Attribute Advisor",
  description: "Customer 360 DWS 标签字典专属数据顾问演示",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
