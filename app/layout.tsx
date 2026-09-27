import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RestoPulse — Restaurant Operations, SOP Checklists & Wastage Management Platform",
  description:
    "All-in-one restaurant operations platform: digital SOP opening checklists, kitchen wastage recording, cost analytics, and staff management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${plusJakarta.variable}`}>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="h-full antialiased text-slate-900 bg-[#F8FAFC] font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
