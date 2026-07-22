import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import Providers from "@/components/Providers";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProManager — Enterprise Project Management",
  description: "The enterprise-grade collaborative platform for high-performance teams.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ProManager",
  },
  openGraph: {
    title: "ProManager",
    description: "Enterprise Project Management Platform",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
      </head>
      <body
        className={`${inter.className} antialiased selection:bg-primary/30 selection:text-primary-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <ServiceWorkerRegistrar />
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
