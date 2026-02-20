import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";

import { siteConfig } from "@/app/constants";
import { inter, doto, pressStart2P } from "@/app/fonts";
import "@/app/globals.css";
import { ProgressBar } from "@/app/progress-bar";
import { Toaster } from "@/app/toaster";
import Header from "@/components/header";
import { Providers } from "@/components/providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "white",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name}`,
  description: siteConfig.description,
  openGraph: {
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    type: "website",
    url: siteConfig.url,
    locale: "en_US",
  },
  icons: siteConfig.icons,
  twitter: {
    card: "summary_large_image",
    site: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.creator,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={`${doto.variable} ${inter.variable} ${pressStart2P.variable} ${doto.className}`}>
      <body className="min-h-dvh antialiased bg-black text-white overscroll-none">
        <div className="flex min-h-dvh w-full flex-col grow pt-16">
          <div className="flex grow flex-col size-full min-h-dvh">
            <Providers>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
              >
                <Header />
                {children}
              </ThemeProvider>
            </Providers>
          </div>
        </div>
        <ProgressBar />
        <Toaster />
      </body>
    </html>
  );
}
