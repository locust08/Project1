"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HOME_INTRO_LINES = [
  "MICHELLE - PAID MEDIA INTERN",
  "I DESIGN REELS, MICROSITES, AND DIGITAL EXPERIENCES THAT MAKE BRANDS FEEL ELEVATED AND CONVERSION-READY",
];

function isHomePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return true;
  }

  if (segments.length === 1) {
    return !["about", "a-propos", "project", "projet"].includes(segments[0]);
  }

  return false;
}

function setScrambleText(element: Element | null, text: string) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.dataset.text = text;
  element.textContent = text;
  element.style.visibility = "visible";
  element.style.clipPath = "";
}

function applyHomeIntroOverride() {
  const introLines = document.querySelectorAll(
    ".intro-text.welcome-text .scramble-wrapper .scramble-text",
  );

  if (introLines.length < HOME_INTRO_LINES.length) {
    return false;
  }

  let isSettled = true;

  HOME_INTRO_LINES.forEach((line, index) => {
    const element = introLines[index];

    if (
      element instanceof HTMLElement &&
      (element.dataset.text !== line || element.textContent !== line)
    ) {
      isSettled = false;
    }

    setScrambleText(element, line);
  });

  return isSettled;
}

export function HomeTextOverridesController() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (!isHomePath(pathname)) {
      return;
    }

    let timeoutId: number | null = null;
    let rafId: number | null = null;

    const applyChanges = () => {
      const settled = applyHomeIntroOverride();

      if (!settled) {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
        }

        rafId = window.requestAnimationFrame(() => {
          applyHomeIntroOverride();
        });
      }
    };

    const observer = new MutationObserver(() => {
      applyChanges();
    });

    applyChanges();

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    timeoutId = window.setTimeout(() => {
      observer.disconnect();
    }, 8000);

    return () => {
      observer.disconnect();

      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return null;
}
