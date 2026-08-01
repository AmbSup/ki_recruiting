import Script from "next/script";
import { OrganizationJsonLd } from "./_components/json-ld";

const GA_MEASUREMENT_ID = "G-T09J4MXD69";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <OrganizationJsonLd />
      {/* type="text/plain" + data-cookieconsent="statistics": Cookiebot hält
          beide Scripts inert bis der Besucher die Statistik-Kategorie
          akzeptiert, dann schreibt Cookiebot type auf "text/javascript" um
          und führt sie aus. Ohne das wäre der GA4-Tag selbst ein
          DSGVO-Verstoß (Cookie-Setzen vor Einwilligung). */}
      <Script
        id="ga4-lib"
        type="text/plain"
        data-cookieconsent="statistics"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" type="text/plain" data-cookieconsent="statistics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
      {/* Delegierter Klick-Listener statt Events in jeder einzelnen Komponente
          zu verdrahten — Telefonnummer (Footer) und Cal.com-Demo-Links tauchen
          über ~20 Marketing-Dateien verteilt auf (Footer, Nav, CTAs, Pricing,
          Pilot-Banner). Ein Listener am Layout-Root fängt alle per Bubbling ab. */}
      <Script id="ga4-click-tracking" strategy="afterInteractive">
        {`
          document.addEventListener('click', function (e) {
            var link = e.target.closest ? e.target.closest('a[href]') : null;
            if (!link || typeof window.gtag !== 'function') return;
            var href = link.getAttribute('href') || '';
            if (href.indexOf('tel:') === 0) {
              window.gtag('event', 'phone_click', { link_url: href });
            } else if (href.indexOf('cal.com') !== -1) {
              window.gtag('event', 'demo_booking_click', { link_url: href });
            }
          });
        `}
      </Script>
      {children}
    </>
  );
}
