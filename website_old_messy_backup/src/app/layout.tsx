import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MountainSafety | LoRa Climber Tracking System",
  description:
    "Professional product website and portal prototype for a LoRa-based mountain climber safety tracking system.",
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