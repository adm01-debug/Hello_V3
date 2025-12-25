export function enableDarkMode() {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
}

export function disableDarkMode() {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}

export function toggleDarkMode() {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    disableDarkMode();
  } else {
    enableDarkMode();
  }
}

export function initDarkMode() {
  const theme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (theme === 'dark' || (!theme && prefersDark)) {
    enableDarkMode();
  }
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}
