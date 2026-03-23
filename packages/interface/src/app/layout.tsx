import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BaseCred",
  description: "Reputation without opinion.",
  other: {
    "apple-mobile-web-app-title": "zkCred",
    "talentapp:project_verification":
      "42a11dde745acaa5e9989d4e6a06660208f5f7103530c1d03b323b2bd5cd4cc9eb17c5d8644260c1327bb7bbff837fb331cfc771b13055fd7a5228042c011bff",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
