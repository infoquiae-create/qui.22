import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import React from 'react'
import MetaPixel from "@/components/MetaPixel";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "Qui - Shop smarter",
  description: "qui - Shop smarter",
};

export default function RootLayout({ children }) {
  const ik = process.env.IMAGEKIT_URL_ENDPOINT;
  let ikOrigin = null;
  try { if (ik) ikOrigin = new URL(ik).origin; } catch {}
  const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(clerkPk);
  return (
    <html lang="en">
      <head>
        <Script
          id="tiktok-pixel"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


ttq.load('D604O23C77U10VTVUHV0');
ttq.page();
}(window, document, 'ttq');`
          }}
        />
        {ikOrigin && (
          <>
            <link rel="dns-prefetch" href={ikOrigin} />
            <link rel="preconnect" href={ikOrigin} crossOrigin="anonymous" />
          </>
        )}
          {/* Meta Pixel Code moved to Client Component */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1509420293656480&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}

      </head>
      <body className={`${outfit.className} antialiased`} suppressHydrationWarning>
          <MetaPixel />
        {isClerkConfigured ? (
          <ClerkProvider publishableKey={clerkPk}>
            <StoreProvider>
              <Toaster />
              {children}
            </StoreProvider>
          </ClerkProvider>
        ) : (
          <StoreProvider>
            <Toaster />
            {children}
          </StoreProvider>
        )}
      </body>
    </html>
  );
}
