import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import DashboardShell from "./componets/dashboard/DashboardShell";
import { cookies } from "next/headers";

const poppins = Poppins({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "BJOT Admin Portal",
  description: "Manage BJOT exams, question banks, students, attendance, and analytics.",
  icons: {
    icon: "/bjot-logo.png",
    apple: "/bjot-logo.png",
  },
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
        <DashboardShell showHeader={isAuthenticated}>
          {children}
        </DashboardShell>
      </body>
    </html>
  );
}
