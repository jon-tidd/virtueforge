import type { Metadata } from "next";
import { Crimson_Text, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const crimson = Crimson_Text({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-crimson",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "VirtueForge — Classical Character Formation Through Story",
  description:
    "Help your children build character through the timeless power of story. Based on the classical cardinal virtues of Courage, Justice, Prudence, and Temperance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${crimson.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
