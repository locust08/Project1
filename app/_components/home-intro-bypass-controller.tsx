"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const DISCOVER_SELECTOR = ".discover-text.clickable";
const INTRO_SELECTOR = ".intro-text.welcome-text";
const PROJECT_GRID_SELECTOR = ".rectangle-item";

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.length <= 1;
}

function revealScrambleText(root: ParentNode) {
  root.querySelectorAll<HTMLElement>(".scramble-text").forEach((node) => {
    if (node.dataset.text && !node.textContent) {
      node.textContent = node.dataset.text;
    }

    node.style.visibility = "visible";
    node.style.opacity = "1";
    node.style.clipPath = "";
  });
}

function stabilizeIntroUi() {
  let changed = false;

  const intro = document.querySelector<HTMLElement>(INTRO_SELECTOR);
  if (intro) {
    intro.style.visibility = "visible";
    intro.style.opacity = "1";
    revealScrambleText(intro);
    changed = true;
  }

  const discover = document.querySelector<HTMLElement>(DISCOVER_SELECTOR);
  if (discover) {
    discover.style.visibility = "visible";
    discover.style.opacity = "1";
    discover.style.pointerEvents = "auto";
    discover.style.clipPath = "";
    revealScrambleText(discover);
    changed = true;
  }

  return changed;
}

export function HomeIntroBypassController() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (!isHomePath(pathname) || typeof document === "undefined") {
      return;
    }

    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const stabilize = () => {
      const hasProjectGrid = Boolean(document.querySelector(PROJECT_GRID_SELECTOR));

      if (hasProjectGrid) {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }

        return true;
      }

      return stabilizeIntroUi();
    };

    stabilize();

    if (!document.querySelector(PROJECT_GRID_SELECTOR)) {
      intervalId = window.setInterval(() => {
        if (stabilize() && intervalId && document.querySelector(PROJECT_GRID_SELECTOR)) {
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
