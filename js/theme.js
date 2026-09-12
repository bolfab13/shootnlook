const PALETTES = {
  classic: {
    light: { '--accent': '#556EE6', '--accent-hover': '#485EC4' },
    dark: { '--accent': '#7187EF', '--accent-hover': '#91A2FF' }
  },
  girly: {
    light: { '--accent': '#D96A9D', '--accent-hover': '#BD4F85' },
    dark: { '--accent': '#EA7EAE', '--accent-hover': '#F2A0C5' }
  },
  campagne: {
    light: { '--accent': '#6F8F68', '--accent-hover': '#587451' },
    dark: { '--accent': '#8EAE82', '--accent-hover': '#ABC89D' }
  },
  vegetal: {
    light: { '--accent': '#5D8A2F', '--accent-hover': '#4A7024' },
    dark: { '--accent': '#78AD59', '--accent-hover': '#9BC87C' }
  }
};

const readJSON = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') || fallback;
  } catch {
    return fallback;
  }
};

export const getTheme = () => localStorage.getItem('theme') || 'light';
export const getColorTheme = () => localStorage.getItem('colorTheme') || 'classic';
export const getThemeOverrides = () => readJSON('themePaletteOverrides', {});

export const applyTheme = (root = document.documentElement, theme = getTheme(), palette = getColorTheme()) => {
  const mode = theme === 'dark' ? 'dark' : 'light';
  const base = PALETTES[palette]?.[mode] || PALETTES.classic[mode];
  const overrides = getThemeOverrides()[palette]?.[mode] || {};
  root.dataset.theme = mode;
  root.dataset.colorTheme = palette;
  Object.entries({ ...base, ...overrides }).forEach(([key, value]) => root.style.setProperty(key, value));
};

export const saveTheme = (theme, palette = getColorTheme()) => {
  localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
  localStorage.setItem('colorTheme', palette);
  applyTheme(document.documentElement);
};
