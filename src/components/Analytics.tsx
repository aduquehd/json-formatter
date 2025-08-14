'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    hj?: (command: string, ...args: any[]) => void;
    _hjSettings?: any;
  }
}

export default function Analytics() {
  const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const HOTJAR_VERSION = 6;

  useEffect(() => {
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      if (!GA_MEASUREMENT_ID) {
        console.log('Google Analytics not configured - Set NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel');
      }
      if (!HOTJAR_ID) {
        console.log('Hotjar not configured - Set NEXT_PUBLIC_HOTJAR_ID in Vercel');
      }
    }
  }, [GA_MEASUREMENT_ID, HOTJAR_ID]);

  return (
    <>
      {/* Google Analytics */}
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}
      
      {/* Hotjar */}
      {HOTJAR_ID && (
        <Script
          id="hotjar"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(h,o,t,j,a,r){
                  h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                  h._hjSettings={hjid:${HOTJAR_ID},hjsv:${HOTJAR_VERSION}};
                  a=o.getElementsByTagName('head')[0];
                  r=o.createElement('script');r.async=1;
                  r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                  a.appendChild(r);
              })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
            `,
          }}
        />
      )}
    </>
  );
}