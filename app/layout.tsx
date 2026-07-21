import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaultyra — See today. Plan tomorrow.",
  description: "Your private, self-hosted financial command center.",
  icons: { icon: "/vaultyra-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
