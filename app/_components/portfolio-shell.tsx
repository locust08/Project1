import Script from "next/script";
import { FireplaceAudioController } from "./fireplace-audio-controller";
import { HomeTextOverridesController } from "./home-text-overrides-controller";
import { ProjectGalleryVideoController } from "./project-gallery-video-controller";
import { ProjectTextOverridesController } from "./project-text-overrides-controller";

export function PortfolioShell() {
  return (
    <>
      <FireplaceAudioController />
      <HomeTextOverridesController />
      <ProjectGalleryVideoController />
      <ProjectTextOverridesController />
      <div id="root" suppressHydrationWarning />
      <Script
        src="/assets/index-BKlZLtrc.js"
        type="module"
        strategy="afterInteractive"
      />
    </>
  );
}
