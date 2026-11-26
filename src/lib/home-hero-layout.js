// Presentation only. Chooses which hero layout the home page shows.
// Set VITE_HOME_HERO_LAYOUT at build time:
//   current   – text on the left, featured course card on the right (default)
//   video     – centred headline above a large stage that plays the course trailer
//   path      – the course drawn as a learning path through its sections
//   editorial – full-bleed course image with a large overlaid headline
// Missing or unknown values fall back to "current". Applies to the one-course (featured)
// catalogue only; the full catalogue always uses "current".
export const HOME_HERO_LAYOUTS = ["current", "video", "path", "editorial"];
export const DEFAULT_HOME_HERO_LAYOUT = "current";

const configured = import.meta.env.VITE_HOME_HERO_LAYOUT;
export const homeHeroLayout = HOME_HERO_LAYOUTS.includes(configured) ? configured : DEFAULT_HOME_HERO_LAYOUT;
