import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "./register-sw";
import { BootSplash } from "@/components/BootSplash";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NutriTracker",
  description: "Registro diário de refeições, treino e progresso nutricional",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NutriTracker",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg text-chalk">
        <RegisterServiceWorker />
        <BootSplash>{children}</BootSplash>
      </body>
    </html>
  );
}
