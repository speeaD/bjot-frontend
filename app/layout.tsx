import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import NavBar from "./componets/Navbar";
import { cookies } from "next/headers";

const poppins = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BJOT ADMIN",
  description: "Admin dashboard for BJOT application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth-token');
  const isAuthenticated = !!authToken?.value;
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased`}
      >
        {isAuthenticated && <NavBar />}
        {children}
      </body>
    </html>
  );
}
