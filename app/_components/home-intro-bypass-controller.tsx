"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const DISCOVER_SELECTOR = ".discover-text";
const CLICKABLE_DISCOVER_SELECTOR = ".discover-text.clickable";
const INTRO_ANIMATION_SELECTOR = ".intro-animation";
const INTRO_SELECTOR = ".intro-text.welcome-text";
const PROJECT_GRID_SELECTOR = ".rectangle-item";
const INTRO_PLAYED_KEY = "introPlayed";
const RESCUE_DELAY_MS = 3500;
const STABILIZE_INTERVAL_MS = 400;

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  return segments.length <= 1;
}

function isElementVisible(element: HTMLElement | null) {
  if (!element) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    styles.display !== "none" &&
    styles.visibility !== "hidden" &&
    Number(styles.opacity) > 0.05 &&
    rect.width > 0 &&
    rect.height > 0
  );
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

  const introAnimation = document.querySelector<HTMLElement>(INTRO_ANIMATION_SELECTOR);
  if (introAnimation) {
    introAnimation.style.visibility = "visible";
    introAnimation.style.opacity = "1";
    changed = true;
  }

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
    discover.style.clipPath = "";

    if (discover.classList.contains("clickable")) {
      discover.style.pointerEvents = "auto";
    }

    const arrow = discover.querySelector<HTMLElement>(".discover-arrow");
    if (arrow) {
      arrow.style.visibility = "visible";
    }

    revealScrambleText(discover);
    changed = true;
  }

  return changed;
}

function hasVisibleHomeUi() {
  const intro = document.querySelector<HTMLElement>(INTRO_SELECTOR);
  if (isElementVisible(intro)) {
    return true;
  }

  const discover = document.querySelector<HTMLElement>(DISCOVER_SELECTOR);
  if (isElementVisible(discover)) {
    return true;
  }

  return Array.from(document.querySelectorAll<HTMLElement>(PROJECT_GRID_SELECTOR)).some(
    (node) => isElementVisible(node),
  );
}

export function HomeIntroBypassController() {
  const pathname = usePathname() ?? "";
  const isHome = isHomePath(pathname);
  const [showRescue, setShowRescue] = useState(false);

  useEffect(() => {
    if (!isHome || typeof document === "undefined") {
      setShowRescue(false);
      return;
    }

    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const stabilize = () => {
      const hasProjectGrid = Boolean(document.querySelector(PROJECT_GRID_SELECTOR));
      const uiIsVisible = hasVisibleHomeUi();

      if (uiIsVisible) {
        setShowRescue(false);
      }

      if (hasProjectGrid && uiIsVisible) {
        if (intervalId) {
          window.clearInterval(intervalId);
          intervalId = null;
        }

        return true;
      }

      return stabilizeIntroUi();
    };

    stabilize();

    intervalId = window.setInterval(() => {
      if (stabilize() && intervalId && hasVisibleHomeUi()) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }, STABILIZE_INTERVAL_MS);

    timeoutId = window.setTimeout(() => {
      if (!hasVisibleHomeUi()) {
        setShowRescue(true);
      }

      if (intervalId) {
        window.clearInterval(intervalId);
      }
    }, RESCUE_DELAY_MS);

    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isHome, pathname]);

  if (!isHome || !showRescue) {
    return null;
  }

  return (
    <div className="home-rescue" role="status" aria-live="polite">
      <div className="home-rescue__panel">
        <p className="home-rescue__copy">
          The intro is taking too long to appear.
        </p>
        <button
          type="button"
          className="home-rescue__button"
          onClick={() => {
            const discover = document.querySelector<HTMLElement>(CLICKABLE_DISCOVER_SELECTOR);
            if (discover) {
              discover.click();
              setShowRescue(false);
              return;
            }

            sessionStorage.setItem(INTRO_PLAYED_KEY, "true");
            window.location.reload();
          }}
        >
          Enter Portfolio
        </button>
      </div>
    </div>
  );
}
