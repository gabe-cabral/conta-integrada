export const colorModePreferences = ['auto', 'light', 'dark'] as const;

export type ColorModePreference = (typeof colorModePreferences)[number];

const storageKey = 'theme';
let systemPreferenceListenerRegistered = false;

function isColorModePreference(value: string | null): value is ColorModePreference {
  return colorModePreferences.some((preference) => preference === value);
}

export function useColorMode() {
  const preference = useState<ColorModePreference>('color-mode-preference', () => 'auto');

  function applyColorMode(value: ColorModePreference) {
    if (!import.meta.client) return;

    const resolvedTheme = value === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : value;

    document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
  }

  function getStoredPreference(): ColorModePreference {
    if (!import.meta.client) return 'auto';

    // The code only runs in the browser; Node also exposes this name as experimental.
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const storedPreference = window.localStorage.getItem(storageKey);
    return isColorModePreference(storedPreference) ? storedPreference : 'auto';
  }

  function setPreference(value: ColorModePreference) {
    preference.value = value;

    if (import.meta.client) {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      window.localStorage.setItem(storageKey, value);
      applyColorMode(value);
    }
  }

  function applyStoredPreference() {
    if (!import.meta.client) return;

    applyColorMode(getStoredPreference());

    if (systemPreferenceListenerRegistered) return;

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredPreference() === 'auto') applyColorMode('auto');
    });
    systemPreferenceListenerRegistered = true;
  }

  function initialize() {
    if (!import.meta.client) return;

    preference.value = getStoredPreference();
    applyStoredPreference();
  }

  return {
    preference,
    applyStoredPreference,
    initialize,
    setPreference,
  };
}
