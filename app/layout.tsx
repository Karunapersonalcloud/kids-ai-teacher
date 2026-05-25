import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.conceptkid.in"),
  title: "ConceptKid - Personal AI Learning Coach for Children",
  description: "Visual chapter learning, diagnostic checks, weak-area strengthening, and parent progress tracking.",
  openGraph: {
    title: "ConceptKid - Personal AI Learning Coach for Children",
    description: "Visual chapter learning, diagnostic checks, weak-area strengthening, and parent progress tracking.",
    url: "https://www.conceptkid.in",
    siteName: "ConceptKid",
    images: [
      {
        url: "/brand/conceptkid-og-v2.png",
        width: 1200,
        height: 630,
        alt: "ConceptKid Kids AI Teacher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConceptKid - Personal AI Learning Coach for Children",
    description: "Visual chapter learning, diagnostic checks, weak-area strengthening, and parent progress tracking.",
    images: ["/brand/conceptkid-og-v2.png"],
  },
  icons: {
    icon: "/brand/favicon-v2.png",
    shortcut: "/brand/favicon-v2.png",
    apple: "/brand/apple-touch-icon-v2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
