import { FireplaceAudioController } from "./fireplace-audio-controller";
import { HomeIntroBypassController } from "./home-intro-bypass-controller";
import { HomeTextOverridesController } from "./home-text-overrides-controller";
import { ProjectGalleryVideoController } from "./project-gallery-video-controller";
import { ProjectTextOverridesController } from "./project-text-overrides-controller";

export function PortfolioShell() {
  return (
    <>
      <FireplaceAudioController />
      <HomeIntroBypassController />
      <HomeTextOverridesController />
      <ProjectGalleryVideoController />
      <ProjectTextOverridesController />
      <div id="root" suppressHydrationWarning />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function () {
  var host = window.location.hostname;
  var params = new URLSearchParams(window.location.search);
  var shouldUseSafeMode = (host === "localhost" || host === "127.0.0.1") && params.get("webgl") !== "1";
  if (!shouldUseSafeMode) return;
  function patchReadPixels(Ctor) {
    if (!Ctor || !Ctor.prototype || Ctor.prototype.__portfolioReadPixelsPatched) {
      return;
    }
    var originalReadPixels = Ctor.prototype.readPixels;
    Ctor.prototype.readPixels = function () {
      return;
    };
    Ctor.prototype.__portfolioReadPixelsPatched = true;
    Ctor.prototype.__portfolioOriginalReadPixels = originalReadPixels;
  }
  patchReadPixels(window.WebGLRenderingContext);
  patchReadPixels(window.WebGL2RenderingContext);
  window.__portfolioWebglSafeMode = true;
})();`,
        }}
      />
      <script src="/assets/index-BKlZLtrc.js" type="module" />
    </>
  );
}
