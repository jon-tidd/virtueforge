import type { Metadata } from "next";
import { Inter, Crimson_Text, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
  title: "Virtue Forge — Build Your Child's Character Through Story",
  description:
    "Children who read 20 minutes a day score in the 90th percentile. Virtue Forge matches your family with the right stories to build courage, wisdom, justice, and self-mastery — backed by 2,500 years of philosophy and modern research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimson.variable} ${cormorant.variable}`}>
      <body>{children}</body>
    </html>
  );
}
