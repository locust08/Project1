"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type VideoConfig = {
  slot: number;
  src: string;
  type?: string;
};

const PLAYBACK_RETRY_EVENTS: Array<keyof DocumentEventMap> = [
  "pointerdown",
  "keydown",
  "touchstart",
];
const PLAYBACK_VISIBILITY_THRESHOLD = 0.6;

const PROJECT_GALLERY_VIDEOS: Record<string, VideoConfig[]> = {
  "atelier-stratus": [
    { slot: 0, src: "/project-videos/two-tails.mp4", type: "video/mp4" },
  ],
  metropole: [
    { slot: 0, src: "/project-videos/khb.mp4", type: "video/mp4" },
  ],
  acheterduneuf: [
    { slot: 0, src: "/project-videos/kapten-batik.mp4", type: "video/mp4" },
  ],
  vickies: [
    { slot: 0, src: "/project-videos/tvc-video.mp4", type: "video/mp4" },
  ],
  "adn-family": [
    { slot: 0, src: "/project-videos/raya-kita-batik.mp4", type: "video/mp4" },
  ],
  atypica: [
    { slot: 0, src: "/project-videos/testing-video.mp4", type: "video/mp4" },
    {
      slot: 1,
      src: "/project-videos/malay-podcast.mp4",
      type: "video/mp4",
    },
    { slot: 2, src: "/project-videos/others-third.mp4", type: "video/mp4" },
    { slot: 3, src: "/project-videos/others-fourth.mp4", type: "video/mp4" },
  ],
};

function getProjectSlug(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const projectIndex = segments.findIndex(
    (segment) => segment === "project" || segment === "projet",
  );

  if (projectIndex === -1) {
    return null;
  }

  return segments[projectIndex + 1] ?? null;
}

function createVideoElement(config: VideoConfig) {
  const wrapper = document.createElement("div");
  wrapper.className = "project-gallery__video-shell";
  wrapper.dataset.projectVideoSrc = config.src;

  const video = document.createElement("video");
  video.className = "project-gallery__video";
  video.autoplay = false;
  video.muted = false;
  video.defaultMuted = false;
  video.loop = true;
  video.playsInline = true;
  video.controls = false;
  video.preload = "metadata";
  video.volume = 1;
  video.setAttribute("aria-label", "Project gallery video");
  video.setAttribute("playsinline", "");

  const source = document.createElement("source");
  source.src = config.src;

  if (config.type) {
    source.type = config.type;
  }

  video.appendChild(source);
  wrapper.appendChild(video);
  video.load();

  return wrapper;
}

export function ProjectGalleryVideoController() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const slug = getProjectSlug(pathname);

    if (!slug) {
      return;
    }

    const videoConfigs = PROJECT_GALLERY_VIDEOS[slug] ?? [];
    if (!videoConfigs.length) {
      return;
    }

    const observedItems = new WeakSet<HTMLElement>();
    const initializedVideos = new WeakSet<HTMLVideoElement>();
    const retryCleanupByVideo = new Map<HTMLVideoElement, () => void>();
    const cleanupByVideo = new Map<HTMLVideoElement, () => void>();
    const getPrimaryGalleryItems = () => {
      const primaryGallery = document.querySelector<HTMLElement>(
        ".project-content__wrapper > .project-gallery",
      );

      if (!primaryGallery) {
        return [];
      }

      return Array.from(
        primaryGallery.querySelectorAll<HTMLElement>(".project-gallery__item"),
      );
    };

    const getManagedGalleryItems = () => {
      const galleryItems = getPrimaryGalleryItems();

      return videoConfigs
        .map((config) => galleryItems[config.slot])
        .filter((item): item is HTMLElement => Boolean(item));
    };

    const clearRetryPlayback = (video: HTMLVideoElement) => {
      const cleanup = retryCleanupByVideo.get(video);

      if (!cleanup) {
        return;
      }

      cleanup();
      retryCleanupByVideo.delete(video);
    };

    const attemptPlayback = async (video: HTMLVideoElement) => {
      try {
        video.defaultMuted = false;
        video.muted = false;
        video.volume = 1;
        await video.play();
        delete video.dataset.projectVideoMutedFallback;
        clearRetryPlayback(video);
      } catch {
        try {
          // Keep the video visually playing even when the browser blocks sound-first autoplay.
          video.defaultMuted = true;
          video.muted = true;
          await video.play();
          video.dataset.projectVideoMutedFallback = "true";
        } catch {
          video.pause();
        }

        if (retryCleanupByVideo.has(video) || !document.contains(video)) {
          return;
        }

        const retryPlayback = () => {
          clearRetryPlayback(video);
          updateActivePlayback();
        };

        const options: AddEventListenerOptions = {
          once: true,
          passive: true,
        };

        PLAYBACK_RETRY_EVENTS.forEach((eventName) => {
          document.addEventListener(eventName, retryPlayback, options);
        });

        retryCleanupByVideo.set(video, () => {
          PLAYBACK_RETRY_EVENTS.forEach((eventName) => {
            document.removeEventListener(eventName, retryPlayback);
          });
        });
      }
    };

    const syncPlayback = (video: HTMLVideoElement, shouldPlay: boolean) => {
      if (!shouldPlay) {
        clearRetryPlayback(video);
        video.pause();
        return;
      }

      void attemptPlayback(video);
    };

    const updateActivePlayback = () => {
      const viewportCenter = window.innerHeight / 2;
      const candidates = getManagedGalleryItems()
        .map((item) => {
          const video =
            item.querySelector<HTMLVideoElement>(".project-gallery__video");

          if (!video) {
            return null;
          }

          const ratio = Number(item.dataset.projectVideoIntersectionRatio ?? "0");
          const rect = item.getBoundingClientRect();
          const distanceToCenter = Math.abs(
            rect.top + rect.height / 2 - viewportCenter,
          );

          return {
            item,
            video,
            ratio,
            distanceToCenter,
            isVisible: item.dataset.projectVideoVisible === "true",
          };
        })
        .filter(
          (
            candidate,
          ): candidate is {
            item: HTMLElement;
            video: HTMLVideoElement;
            ratio: number;
            distanceToCenter: number;
            isVisible: boolean;
          } => Boolean(candidate),
        );

      const activeCandidate =
        candidates
          .filter((candidate) => candidate.isVisible)
          .sort((left, right) => {
            if (right.ratio !== left.ratio) {
              return right.ratio - left.ratio;
            }

            return left.distanceToCenter - right.distanceToCenter;
          })[0] ?? null;

      for (const candidate of candidates) {
        syncPlayback(candidate.video, candidate === activeCandidate);
      }
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = entry.target as HTMLElement;
          const isVisible =
            entry.isIntersecting &&
            entry.intersectionRatio >= PLAYBACK_VISIBILITY_THRESHOLD;

          item.dataset.projectVideoVisible = isVisible ? "true" : "false";
          item.dataset.projectVideoIntersectionRatio =
            entry.intersectionRatio.toString();

          const video =
            item.querySelector<HTMLVideoElement>(".project-gallery__video");

          if (video) {
            updateActivePlayback();
          }
        }
      },
      {
        threshold: [0, PLAYBACK_VISIBILITY_THRESHOLD, 1],
      },
    );

    const registerGalleryItem = (item: HTMLElement) => {
      item.dataset.projectVideoVisible ??= "false";

      if (!observedItems.has(item)) {
        observedItems.add(item);
        visibilityObserver.observe(item);
      }

      const video = item.querySelector<HTMLVideoElement>(".project-gallery__video");

      if (!video) {
        return;
      }

      if (!initializedVideos.has(video)) {
        initializedVideos.add(video);

        const handleReady = () => {
          updateActivePlayback();
        };

        const handleError = () => {
          clearRetryPlayback(video);
          item.dataset.projectVideoError = "true";
        };

        video.addEventListener("loadedmetadata", handleReady);
        video.addEventListener("canplay", handleReady);
        video.addEventListener("error", handleError);

        cleanupByVideo.set(video, () => {
          clearRetryPlayback(video);
          video.pause();
          video.removeEventListener("loadedmetadata", handleReady);
          video.removeEventListener("canplay", handleReady);
          video.removeEventListener("error", handleError);
        });
      }

      updateActivePlayback();
    };

    const applyVideoReplacements = () => {
      const galleryItems = getPrimaryGalleryItems();

      if (!galleryItems.length) {
        return false;
      }

      const hasAllVideoTargets = videoConfigs.every((config) => galleryItems[config.slot]);

      if (!hasAllVideoTargets) {
        return false;
      }

      for (const config of videoConfigs) {
        const item = galleryItems[config.slot];

        if (!item) {
          continue;
        }

        const currentSrc = item.dataset.projectVideoSrc;
        const currentVideo =
          item.querySelector<HTMLVideoElement>(".project-gallery__video");
        const shouldReplace = currentSrc !== config.src || !currentVideo;

        if (shouldReplace) {
          if (currentVideo) {
            cleanupByVideo.get(currentVideo)?.();
            cleanupByVideo.delete(currentVideo);
          }

          item.replaceChildren(createVideoElement(config));
          item.dataset.projectVideoSrc = config.src;
          delete item.dataset.projectVideoError;
        }

        registerGalleryItem(item);
      }

      updateActivePlayback();
      return true;
    };

    let timeoutId: number | null = null;
    const observer = new MutationObserver(() => {
      if (applyVideoReplacements()) {
        observer.disconnect();
      }
    });

    if (!applyVideoReplacements()) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      timeoutId = window.setTimeout(() => {
        observer.disconnect();
      }, 5000);
    }

    return () => {
      observer.disconnect();
      visibilityObserver.disconnect();

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      for (const cleanup of cleanupByVideo.values()) {
        cleanup();
      }

      cleanupByVideo.clear();
      retryCleanupByVideo.clear();
    };
  }, [pathname]);

  return null;
}
