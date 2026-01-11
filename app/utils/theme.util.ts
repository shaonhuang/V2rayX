const SystemThemeManager = (() => {
  // Define the type for the callback function
  type ThemeChangeCallback = (isDarkMode: boolean) => void;

  // Initialize handleThemeChange as null or a ThemeChangeCallback
  let handleThemeChange: ThemeChangeCallback | null = null;

  /**
   * Enables the system theme listener with a provided callback.
   * @param callback - A function to be called when the system theme changes.
   */
  function enableSystemThemeListener(callback: ThemeChangeCallback) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (!handleThemeChange) {
      // Define the handler that wraps the callback
      handleThemeChange = (event: MediaQueryListEvent) => {
        callback(event.matches);
      };

      // Add the event listener
      mediaQuery.addEventListener('change', handleThemeChange);

      // Optionally, invoke the callback immediately with the current theme
      callback(mediaQuery.matches);

      console.log('System theme listener enabled.');
    } else {
      console.warn('System theme listener is already enabled.');
    }
  }

  /**
   * Cancels the system theme listener.
   */
  function cancelSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    if (handleThemeChange) {
      mediaQuery.removeEventListener('change', handleThemeChange);
      handleThemeChange = null;
      console.log('System theme listener canceled.');
    } else {
      console.warn('No system theme listener to cancel.');
    }
  }

  /**
   * Gets the actual theme value, resolving 'system' to the current system preference.
   * @param theme - The theme value ('light', 'dark', or 'system')
   * @returns The resolved theme ('light' or 'dark')
   */
  function getResolvedTheme(theme: string): 'light' | 'dark' {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme as 'light' | 'dark';
  }

  /**
   * Checks if the current theme (or system theme) is dark.
   * @param theme - The theme value ('light', 'dark', or 'system')
   * @returns true if the theme is dark, false otherwise
   */
  function isDarkMode(theme: string): boolean {
    return getResolvedTheme(theme) === 'dark';
  }

  return {
    enableSystemThemeListener,
    cancelSystemThemeListener,
    getResolvedTheme,
    isDarkMode,
  };
})();

export default SystemThemeManager;
