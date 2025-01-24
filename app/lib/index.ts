export const handleThemeChange = (theme: string) => {
  // On page load or when changing themes, best to add inline in `head` to avoid FOUC
  // if (
  //   localStorage.theme === 'dark' ||
  //   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  // ) {
  //   document.documentElement.classList.add('dark');
  // } else {
  //   document.documentElement.classList.remove('dark');
  // }
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }

  // Whenever the user explicitly chooses light mode
  localStorage.theme = 'light';

  // Whenever the user explicitly chooses dark mode
  localStorage.theme = 'dark';

  // Whenever the user explicitly chooses to respect the OS preference
  localStorage.removeItem('theme');
};
