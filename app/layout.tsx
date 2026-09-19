import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="h-full bg-slate-50">
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="h-full antialiased text-slate-900 bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
