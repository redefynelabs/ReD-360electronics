import type { Metadata } from "next";
import "./globals.css";
import { gotham } from "./fonts";
import { Toaster } from "react-hot-toast";
import { StoreProvider } from "./provider";

export const metadata: Metadata = {
  title: "360 Electronics",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={gotham.className}>
      <body
        className={`antialiased`}
      >
        <StoreProvider>

          <Toaster />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
