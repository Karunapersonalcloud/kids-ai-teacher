import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.conceptkid.in"),
  title: "ConceptKid - Kids AI Teacher",
  description: "A kid-friendly AI education dashboard for children and parents.",
  openGraph: {
    title: "ConceptKid - Kids AI Teacher",
    description: "A kid-friendly AI education dashboard for children and parents.",
    url: "https://www.conceptkid.in",
    siteName: "ConceptKid",
    images: [
      {
        url: "/brand/conceptkid-og-v3.png",
        width: 1200,
        height: 630,
        alt: "ConceptKid Kids AI Teacher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConceptKid - Kids AI Teacher",
    description: "A kid-friendly AI education dashboard for children and parents.",
    images: ["/brand/conceptkid-og-v3.png"],
  },
  icons: {
    icon: "/brand/favicon-v3.png",
    shortcut: "/brand/favicon-v3.png",
    apple: "/brand/apple-touch-icon.png",
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
