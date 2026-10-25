import type { Metadata, Viewport } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
export const metadata: Metadata = {
  title: "Solace · A little closer to the cosmos",
  description:
    "Your place in the universe. Explore real planetary positions, travel through time, and find the Moon, planets and stars above your own patch of Earth.",
  applicationName: "Solace",
  openGraph: {
    title: "Solace · A little closer to the cosmos",
    description:
      "Eight worlds. One star. And you, somewhere in the middle of it all.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = {
  themeColor: "#090c0e",
  colorScheme: "dark",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
