import { AnalyticsProvider } from "@factory/analytics/client";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { analytics } from "@/analytics";
import { env } from "@/env";
import { currentUser } from "@/server/supabase";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pantry Pal",
  description: "Know what's in your pantry and what expires soon.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <AnalyticsProvider
          app={analytics.app}
          apiKey={env.NEXT_PUBLIC_POSTHOG_KEY}
          apiHost={env.NEXT_PUBLIC_POSTHOG_HOST}
          userId={user?.id}
        >
          {children}
        </AnalyticsProvider>
      </body>
    </html>
  );
}
