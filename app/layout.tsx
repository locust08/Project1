import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thibault Guignand | Portfolio",
  description: "Local Next.js clone of the Thibault Guignand portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
