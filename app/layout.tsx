import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSiteMetadata } from "@/hooks/useSiteMetadata";
import { getNavigation } from "@/hooks/useNavigation";
import { getUIStrings } from "@/hooks/useUIStrings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteMetadata = await getSiteMetadata();

  return {
    title: siteMetadata.meta.default_title,
    description: siteMetadata.meta.default_description,
    keywords: siteMetadata.meta.keywords,
    openGraph: {
      title: siteMetadata.meta.default_title,
      description: siteMetadata.meta.default_description,
      url: siteMetadata.site.url,
      siteName: siteMetadata.site.name,
      images: [
        {
          url: siteMetadata.meta.og_image,
          width: 1200,
          height: 630,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteMetadata.meta.default_title,
      description: siteMetadata.meta.default_description,
      images: [siteMetadata.meta.og_image],
      creator: siteMetadata.meta.twitter_handle,
    },
    icons: {
      icon: siteMetadata.meta.favicon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [navigation, uiStrings] = await Promise.all([
    getNavigation(),
    getUIStrings(),
  ]);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <ToastProvider>
            <CartProvider>
              <Header navigation={navigation} uiStrings={uiStrings} />
              {children}
              <Footer navigation={navigation} />
            </CartProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
