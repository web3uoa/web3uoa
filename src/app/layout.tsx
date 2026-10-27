import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Effects } from "@/components/effects";
import { Web3Provider } from "@/components/web3-provider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "WEB3UOA - University of Auckland Web3 Club",
  description: "Educating the next generation of blockchain innovators.",
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{document.documentElement.dataset.theme=localStorage.getItem("theme")==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <Web3Provider>
          <div className="relative min-h-screen overflow-clip">
            <Effects />
            <div
              aria-hidden="true"
              className="bg-aurora pointer-events-none absolute inset-x-0 top-0 h-[900px]"
            />
            <div className="relative z-10">
              <Navbar />
              {children}
              <Footer />
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
