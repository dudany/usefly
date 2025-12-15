import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { WebsiteProvider } from "@/components/providers/website-provider"
import { SegmentsProvider } from "@/components/providers/segments-provider"
import { FilterProvider } from "@/contexts/filter-context"
import { Suspense } from "react"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Usefly",
  description: "Visualize how agentic users explore your app. Identify bottlenecks and discover insights.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <WebsiteProvider>
            <SegmentsProvider>
              <Suspense>
                <FilterProvider>
                  {children}
                </FilterProvider>
              </Suspense>
            </SegmentsProvider>
          </WebsiteProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
