// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/app/components/AuthProvider";
import Nav from "./components/Nav";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Able",
  description: "Interactive learning, designed to be fun.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
