export const mediaQueries = {
  xs: `@media (min-width: 320px)`,
  sm: `@media (min-width: 640px)`,
  md: `@media (min-width: 768px)`,
  lg: `@media (min-width: 1024px)`,
  xl: `@media (min-width: 1280px)`,
  '2xl': `@media (min-width: 1536px)`,
  
  mobile: `@media (max-width: 767px)`,
  tablet: `@media (min-width: 768px) and (max-width: 1023px)`,
  desktop: `@media (min-width: 1024px)`,
  
  portrait: `@media (orientation: portrait)`,
  landscape: `@media (orientation: landscape)`,
  
  touch: `@media (hover: none) and (pointer: coarse)`,
  mouse: `@media (hover: hover) and (pointer: fine)`,
  
  reducedMotion: `@media (prefers-reduced-motion: reduce)`,
  darkMode: `@media (prefers-color-scheme: dark)`,
  lightMode: `@media (prefers-color-scheme: light)`,
} as const;

export function useMediaQuery(query: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia(query);
  const [matches, setMatches] = React.useState(mediaQuery.matches);

  React.useEffect(() => {
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mediaQuery]);

  return matches;
}
