import "./globals.css";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";

const fontin = localFont({
  src: [
    { path: "./fonts/Fontin-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Fontin-Italic.otf",  weight: "400", style: "italic" },
    { path: "./fonts/Fontin-Bold.otf",    weight: "700", style: "normal" },
  ],
  variable: "--font-fontin",
  display: "swap",
});

const fontinSmallCaps = localFont({
  src: [
    { path: "./fonts/Fontin-SmallCaps.otf", weight: "400", style: "normal" },
  ],
  variable: "--font-fontin-sc",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type RootLayoutPropsType = {
  children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutPropsType) => {
  return (
    <html
      suppressHydrationWarning
      className={`${fontin.variable} ${fontinSmallCaps.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
};

export default RootLayout;
