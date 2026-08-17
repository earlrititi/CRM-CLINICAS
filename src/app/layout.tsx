import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Reservas",
  description: "CRM SaaS para clinicas centrado en agenda, pacientes y reservas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
