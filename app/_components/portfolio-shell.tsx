import Script from "next/script";

export function PortfolioShell() {
  return (
    <>
      <div id="root" suppressHydrationWarning />
      <Script
        src="/assets/index-BKlZLtrc.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
