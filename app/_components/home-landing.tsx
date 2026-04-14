import Link from "next/link";

type HomeLandingProps = {
  lang?: string;
};

type ProjectCard = {
  slug: string;
  title: string;
  client: string;
  blurb: string;
  image: string;
};

const PROJECTS: ProjectCard[] = [
  {
    slug: "atelier-stratus",
    title: "Signature Market - Two Tails",
    client: "Signature Market",
    blurb: "Short-form video, campaign visuals, and a conversion-focused microsite.",
    image: "/img/stratus/signature-market/two-tails-hero-background.png",
  },
  {
    slug: "metropole",
    title: "Peach Strudel",
    client: "Kenny Hills Bakers",
    blurb: "Premium reels and a polished digital story for a seasonal launch.",
    image: "/img/metropole/peach-strudel/peach-strudel-1.png",
  },
  {
    slug: "acheterduneuf",
    title: "Kapten Batik",
    client: "Kapten Batik",
    blurb: "Modern retail storytelling with a more editorial campaign treatment.",
    image: "/img/acheterduneuf/kapten-batik/kapten-batik-1.png",
  },
  {
    slug: "vickies",
    title: "CNY TVC",
    client: "Vickie's",
    blurb: "Festive campaign rollout with bold visuals and product-led framing.",
    image: "/img/vickies/cny-tvc/cny-tvc-1.png",
  },
  {
    slug: "adn-family",
    title: "Hari Raya Video",
    client: "ADN Family",
    blurb: "Warm, cinematic campaign frames adapted into a simple showcase flow.",
    image: "/img/adn-family/hari-raya-video/hari-raya-video-1.png",
  },
];

const COPY = {
  en: {
    badge: "Michelle - Paid Media Intern",
    title: "Campaign reels, microsites, and portfolio-ready ad experiences.",
    intro:
      "A lighter, reliable home page for this portfolio. The project pages are still linked below, but the landing experience now opens immediately without the fragile intro sequence.",
    about: "About",
    work: "View Work",
    openProject: "Open Project",
  },
  fr: {
    badge: "Michelle - Stagiaire Paid Media",
    title: "Reels de campagne, microsites et experiences publicitaires portfolio-ready.",
    intro:
      "Une page d'accueil plus legere et plus fiable. Les pages projet restent accessibles ci-dessous, mais l'ouverture ne depend plus de l'intro fragile.",
    about: "A propos",
    work: "Voir les projets",
    openProject: "Ouvrir le projet",
  },
} as const;

function getCopy(lang?: string) {
  return lang === "fr" ? COPY.fr : COPY.en;
}

function withLang(lang: string | undefined, path: string) {
  if (lang && lang !== "en") {
    return `/${lang}${path}`;
  }

  if (lang === "en") {
    return `/en${path}`;
  }

  return path;
}

export function HomeLanding({ lang }: HomeLandingProps) {
  const copy = getCopy(lang);
  const aboutHref = withLang(lang, "/about");

  return (
    <main className="home-landing">
      <section className="home-landing__hero">
        <div className="home-landing__hero-panel">
          <p className="home-landing__eyebrow">{copy.badge}</p>
          <h1 className="home-landing__title">{copy.title}</h1>
          <p className="home-landing__intro">{copy.intro}</p>
          <div className="home-landing__actions">
            <a className="home-landing__button" href="#work">
              {copy.work}
            </a>
            <Link className="home-landing__button home-landing__button--ghost" href={aboutHref}>
              {copy.about}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-landing__projects" id="work">
        {PROJECTS.map((project) => {
          const href = withLang(lang, `/project/${project.slug}`);

          return (
            <article className="home-landing__card" key={project.slug}>
              <div className="home-landing__image-wrap">
                <img
                  alt={project.title}
                  className="home-landing__image"
                  loading="lazy"
                  src={project.image}
                />
              </div>
              <div className="home-landing__card-body">
                <p className="home-landing__client">{project.client}</p>
                <h2 className="home-landing__card-title">{project.title}</h2>
                <p className="home-landing__card-copy">{project.blurb}</p>
                <Link className="home-landing__link" href={href}>
                  {copy.openProject}
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
