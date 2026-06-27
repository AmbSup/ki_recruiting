import type { Metadata } from "next";
import { Manrope, Newsreader, Syne, Inter, Playfair_Display, Montserrat, Bebas_Neue } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], style: ["normal", "italic"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  metadataBase: new URL("https://app.neuronic-automation.ai"),
  title: {
    default: "AI Funnel Expert",
    template: "%s · AI Funnel Expert",
  },
  description: "AI-Funnels mit KI-Anruf für Sales und Recruiting — von Neuronic Automation",
  applicationName: "AI Funnel Expert",
  authors: [{ name: "Neuronic Automation", url: "https://neuronic-automation.ai" }],
  openGraph: {
    type: "website",
    siteName: "AI Funnel Expert",
    title: "AI Funnel Expert",
    description: "AI-Funnels mit KI-Anruf für Sales und Recruiting — von Neuronic Automation",
    url: "https://app.neuronic-automation.ai",
    images: [
      {
        url: "/branding/neuronic-logo.png",
        width: 1200,
        height: 1200,
        alt: "Neuronic Automation",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AI Funnel Expert",
    description: "AI-Funnels mit KI-Anruf für Sales und Recruiting",
    images: ["/branding/neuronic-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${manrope.variable} ${newsreader.variable} ${syne.variable} ${inter.variable} ${playfair.variable} ${montserrat.variable} ${bebas.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
