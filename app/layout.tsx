import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Baela — Make room for your next chapter",
    template: "%s · Baela",
  },
  description: site.description,
  openGraph: { title: "Baela", description: site.description, type: "website" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.variable + " font-sans antialiased"}>
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="min-h-[65vh]">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
