"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

const AUDIO_SOURCE = "/audio/fireplace-ambient.mp3";
const DISCOVER_SELECTOR = ".discover-text.clickable";

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.length <= 1;
}

export function FireplaceAudioController() {
  const pathname = usePathname() ?? "";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resumeHandlersRef = useRef<(() => void) | null>(null);
  const [hasDiscoverCta, setHasDiscoverCta] = useState(false);
  const [hasExitedFireplace, setHasExitedFireplace] = useState(false);

  const shouldPlay = useMemo(
    () => isHomePath(pathname) && hasDiscoverCta && !hasExitedFireplace,
    [hasDiscoverCta, hasExitedFireplace, pathname],
  );

  useEffect(() => {
    const audio = new Audio(AUDIO_SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.35;
    audioRef.current = audio;

    return () => {
      resumeHandlersRef.current?.();
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const syncDiscoverState = () => {
      setHasDiscoverCta(Boolean(document.querySelector(DISCOVER_SELECTOR)));
    };

    const observer = new MutationObserver(syncDiscoverState);
    syncDiscoverState();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleDiscoverClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(DISCOVER_SELECTOR)) {
        setHasExitedFireplace(true);
      }
    };

    document.addEventListener("click", handleDiscoverClick, true);

    return () => {
      document.removeEventListener("click", handleDiscoverClick, true);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const clearResumeHandlers = () => {
      resumeHandlersRef.current?.();
      resumeHandlersRef.current = null;
    };

    if (!shouldPlay) {
      clearResumeHandlers();
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    let cancelled = false;

    const tryPlay = async () => {
      try {
        await audio.play();
        if (!cancelled) {
          clearResumeHandlers();
        }
      } catch {
        if (cancelled || resumeHandlersRef.current) {
          return;
        }

        const retryPlayback = () => {
          void tryPlay();
        };

        const options: AddEventListenerOptions = { once: true, passive: true };
        const events: Array<keyof DocumentEventMap> = [
          "pointerdown",
          "keydown",
          "touchstart",
        ];

        events.forEach((eventName) => {
          document.addEventListener(eventName, retryPlayback, options);
        });

        resumeHandlersRef.current = () => {
          events.forEach((eventName) => {
            document.removeEventListener(eventName, retryPlayback);
          });
        };
      }
    };

    void tryPlay();

    return () => {
      cancelled = true;
    };
  }, [shouldPlay]);

  return null;
}
