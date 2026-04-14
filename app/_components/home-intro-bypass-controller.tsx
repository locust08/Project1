"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DISCOVER_SELECTOR = ".discover-text.clickable";
const INTRO_SELECTOR = ".intro-text.welcome-text";
const SESSION_FLAG = "codex-home-intro-bypassed";

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.length <= 1;
}

function triggerDiscoverCta() {
  const discover = document.querySelector<HTMLElement>(DISCOVER_SELECTOR);

  if (!discover) {
    return false;
  }

  if (sessionStorage.getItem(SESSION_FLAG) === "true") {
    return true;
  }

  discover.click();
  sessionStorage.setItem(SESSION_FLAG, "true");
  return true;
}

export function HomeIntroBypassController() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (!isHomePath(pathname) || typeof document === "undefined") {
      return;
    }

    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const tryBypass = () => {
      const hasIntro = Boolean(document.querySelector(INTRO_SELECTOR));

      if (!hasIntro) {
        return false;
      }

      return triggerDiscoverCta();
    };

    if (!tryBypass()) {
      intervalId = window.setInterval(() => {
        if (tryBypass() && intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      }, 400);
    }

    timeoutId = window.setTimeout(() => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    }, 10000);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return null;
}
