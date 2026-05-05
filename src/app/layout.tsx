import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ClientLayout } from "@/components/ClientLayout";
import { SidebarProvider } from "@/components/SidebarProvider";

export const metadata: Metadata = {
  title: "Triple-A",
  description: "Internal organization portal",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <SidebarProvider>
            <ClientLayout>{children}</ClientLayout>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
