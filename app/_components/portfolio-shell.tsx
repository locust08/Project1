import Script from "next/script";
import { FireplaceAudioController } from "./fireplace-audio-controller";
import { ProjectGalleryVideoController } from "./project-gallery-video-controller";

export function PortfolioShell() {
  return (
    <>
      <FireplaceAudioController />
      <ProjectGalleryVideoController />
      <div id="root" suppressHydrationWarning />
      <Script
        src="/assets/index-BKlZLtrc.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
