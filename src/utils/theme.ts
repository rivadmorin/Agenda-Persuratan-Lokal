import { argbFromHex, themeFromSourceColor, applyTheme, hexFromArgb } from "@material/material-color-utilities";

export function generateM3Theme(seedColor: string) {
  const theme = themeFromSourceColor(argbFromHex(seedColor));
  const tokens: Record<string, string> = {};

  // Map M3 dynamic colors to CSS variables
  const colorMap = {
    primary: theme.schemes.light.primary,
    'on-primary': theme.schemes.light.onPrimary,
    'primary-container': theme.schemes.light.primaryContainer,
    'on-primary-container': theme.schemes.light.onPrimaryContainer,
    secondary: theme.schemes.light.secondary,
    'on-secondary': theme.schemes.light.onSecondary,
    'secondary-container': theme.schemes.light.secondaryContainer,
    'on-secondary-container': theme.schemes.light.onSecondaryContainer,
    tertiary: theme.schemes.light.tertiary,
    'on-tertiary': theme.schemes.light.onTertiary,
    'tertiary-container': theme.schemes.light.tertiaryContainer,
    'on-tertiary-container': theme.schemes.light.onTertiaryContainer,
    error: theme.schemes.light.error,
    'on-error': theme.schemes.light.onError,
    'error-container': theme.schemes.light.errorContainer,
    'on-error-container': theme.schemes.light.onErrorContainer,
    background: theme.schemes.light.background,
    'on-background': theme.schemes.light.onBackground,
    surface: theme.schemes.light.surface,
    'on-surface': theme.schemes.light.onSurface,
    'surface-variant': theme.schemes.light.surfaceVariant,
    'on-surface-variant': theme.schemes.light.onSurfaceVariant,
    outline: theme.schemes.light.outline,
    'outline-variant': theme.schemes.light.outlineVariant,
    'surface-container-lowest': theme.palettes.neutral.tone(100),
    'surface-container-low': theme.palettes.neutral.tone(96),
    'surface-container': theme.palettes.neutral.tone(94),
    'surface-container-high': theme.palettes.neutral.tone(92),
    'surface-container-highest': theme.palettes.neutral.tone(90),
  };

  Object.entries(colorMap).forEach(([key, value]) => {
    const hex = hexFromArgb(value);
    tokens[`--md-sys-color-${key}`] = hex;
    document.documentElement.style.setProperty(`--md-sys-color-${key}`, hex);
  });

  return tokens;
}
