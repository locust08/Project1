"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

type OverrideRow = {
  label: string;
  value: string;
};

type ProjectOverride = {
  description: string;
  year: string;
  rows: OverrideRow[];
  heroRows?: OverrideRow[];
  infoRows?: OverrideRow[];
  heroBackgroundImage?: string;
};

const NEXT_PROJECT_BACKGROUND_OVERRIDES = [
  {
    title: "SIGNATURE MARKET - TWO TAILS",
    imageUrl: "/img/stratus/signature-market/two-tails-hero-background.png",
  },
] as const;

const PROJECT_TEXT_OVERRIDES: Record<string, ProjectOverride> = {
  "atelier-stratus": {
    description:
      "A MODERN CAMPAIGN EXPERIENCE COMBINING SHORT-FORM VIDEO AND A HIGH-CONVERSION MICROSITE",
    year: "2026",
    heroBackgroundImage:
      "/img/stratus/signature-market/two-tails-hero-background.png",
    rows: [
      { label: "CLIENT", value: "SIGNATURE MARKET" },
      { label: "TOOLS", value: "GOOGLE FLOW, FIGMA, STITCH, CODEX" },
      { label: "FOCUS", value: "PRODUCT STORYTELLING & CONVERSION" },
    ],
  },
  metropole: {
    description:
      "A PREMIUM DIGITAL EXPERIENCE DESIGNED TO SHOWCASE THE PEACH STRUDEL AND DRIVE ORDER INTENT",
    year: "2026",
    rows: [
      { label: "CLIENT", value: "KENNY HILLS BAKERS" },
      { label: "PROJECT", value: "PEACH STRUDEL REELS & MICROSITE" },
      { label: "TOOLS", value: "GOOGLE FLOW, FIGMA, STITCH, CODEX" },
      { label: "FOCUS", value: "VISUAL STORYTELLING & PURCHASE FLOW" },
    ],
    heroRows: [
      { label: "CLIENT", value: "KENNY HILLS BAKERS" },
      { label: "TOOLS", value: "GOOGLE FLOW, FIGMA, STITCH, CODEX" },
      { label: "FOCUS", value: "VISUAL STORYTELLING & PURCHASE FLOW" },
    ],
  },
  acheterduneuf: {
    description:
      "A PREMIUM DIGITAL EXPERIENCE THAT REFRAMES MALAYSIAN BATIK FOR MODERN EVERYDAY WEAR",
    year: "2026",
    rows: [
      { label: "CLIENT", value: "KAPTEN BATIK" },
      { label: "PROJECT", value: "COLLECTION REELS & MICROSITE" },
      { label: "TOOLS", value: "GOOGLE FLOW, FIGMA, STITCH, CODEX" },
      {
        label: "FOCUS",
        value: "BRAND STORYTELLING & COLLECTION DISCOVERY",
      },
    ],
  },
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

function setScrambleText(element: Element | null, text: string) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const isAlreadyApplied =
    element.dataset.text === text &&
    element.textContent === text &&
    element.style.visibility === "visible" &&
    element.style.clipPath === "";

  if (isAlreadyApplied) {
    return;
  }

  element.dataset.text = text;
  element.textContent = text;
  element.style.visibility = "visible";
  element.style.clipPath = "";
}

function createInfoItem(prefix: "project-hero" | "project-info", row: OverrideRow) {
  const item = document.createElement("div");
  item.className = `${prefix}__info-item`;

  const labelWrapper = document.createElement("span");
  labelWrapper.className = `${prefix}__info-label`;

  const labelText = document.createElement("span");
  labelText.className = "scramble-text";
  labelText.dataset.text = row.label;
  labelText.textContent = row.label;

  const valueWrapper = document.createElement("span");
  valueWrapper.className = `${prefix}__info-value`;

  const valueText = document.createElement("span");
  valueText.className = "scramble-text";
  valueText.dataset.text = row.value;
  valueText.textContent = row.value;

  labelWrapper.appendChild(labelText);
  valueWrapper.appendChild(valueText);
  item.append(labelWrapper, valueWrapper);

  return item;
}

function setHeroBackgroundImage(imageUrl?: string) {
  const background = document.querySelector<HTMLElement>(".project-hero__background");

  if (!background) {
    return false;
  }

  if (imageUrl) {
    background.style.backgroundImage = `url("${imageUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
    background.dataset.projectOverrideBackground = imageUrl;
    return true;
  }

  background.style.backgroundImage = "";
  background.style.backgroundSize = "";
  background.style.backgroundPosition = "";
  background.style.backgroundRepeat = "";
  delete background.dataset.projectOverrideBackground;
  return true;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toUpperCase();
}

function setNextProjectBackgroundImage() {
  const mobileNextProject = document.querySelector(".project-next-mobile");

  if (mobileNextProject) {
    return true;
  }

  const background = document.querySelector<HTMLElement>(".project-next__background");
  const title = document.querySelector<HTMLElement>(".project-next__title");

  if (!background || !title) {
    return false;
  }

  const normalizedTitle = normalizeText(title.textContent ?? "");

  if (!normalizedTitle) {
    return false;
  }

  const match = NEXT_PROJECT_BACKGROUND_OVERRIDES.find((override) =>
    normalizedTitle.includes(normalizeText(override.title)),
  );

  if (match) {
    background.style.backgroundImage = `url("${match.imageUrl}")`;
    background.style.backgroundSize = "cover";
    background.style.backgroundPosition = "center";
    background.style.backgroundRepeat = "no-repeat";
    background.dataset.projectOverrideNextBackground = match.imageUrl;
    return true;
  }

  if (background.dataset.projectOverrideNextBackground) {
    background.style.backgroundImage = "";
    background.style.backgroundSize = "";
    background.style.backgroundPosition = "";
    background.style.backgroundRepeat = "";
    delete background.dataset.projectOverrideNextBackground;
  }

  return true;
}

function getRowsForPrefix(
  prefix: "project-hero" | "project-info",
  override: ProjectOverride,
) {
  if (prefix === "project-hero" && override.heroRows) {
    return override.heroRows;
  }

  if (prefix === "project-info" && override.infoRows) {
    return override.infoRows;
  }

  return override.rows;
}

function applyOverride(slug: string, override: ProjectOverride) {
  const descriptionNodes = document.querySelectorAll(
    ".project-hero__description .scramble-text, .project-info__description .scramble-text",
  );
  const yearNodes = document.querySelectorAll(
    ".project-hero__year .scramble-text, .project-info__year .scramble-text",
  );
  let applied =
    descriptionNodes.length > 0 &&
    yearNodes.length > 0 &&
    descriptionNodes.length === 2 &&
    yearNodes.length === 2;

  descriptionNodes.forEach((node) => setScrambleText(node, override.description));
  yearNodes.forEach((node) => setScrambleText(node, override.year));
  applied = setHeroBackgroundImage(override.heroBackgroundImage) && applied;

  (["project-hero", "project-info"] as const).forEach((prefix) => {
    const block = document.querySelector<HTMLElement>(`.${prefix}__info-block`);
    const rows = getRowsForPrefix(prefix, override);

    if (!block) {
      applied = false;
      return;
    }

    const hasExpectedRows =
      block.dataset.projectOverrideSlug === slug && block.childElementCount === rows.length;

    if (hasExpectedRows) {
      return;
    }

    block.replaceChildren(
      ...rows.map((row) => createInfoItem(prefix, row)),
    );
    block.dataset.projectOverrideSlug = slug;
    applied = false;
  });

  return applied;
}

export function ProjectTextOverridesController() {
  const pathname = usePathname() ?? "";

  useEffect(() => {
    const slug = getProjectSlug(pathname);

    if (!slug) {
      return;
    }

    const override = PROJECT_TEXT_OVERRIDES[slug];
    const applyChanges = () => {
      const nextProjectBackgroundApplied = setNextProjectBackgroundImage();

      if (!override) {
        return nextProjectBackgroundApplied;
      }

      return applyOverride(slug, override) && nextProjectBackgroundApplied;
    };

    let timeoutId: number | null = null;
    const observer = new MutationObserver(() => {
      if (applyChanges()) {
        observer.disconnect();
      }
    });

    if (!applyChanges()) {
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

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [pathname]);

  return null;
}
