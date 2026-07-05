import { argbFromHex, themeFromSourceColor, hexFromArgb } from "@material/material-color-utilities";

export function generateM3Theme(seedColor: string) {
  const theme = themeFromSourceColor(argbFromHex(seedColor));
  
  const getCssVars = (scheme: any) => {
    return `
      --md-sys-color-primary: ${hexFromArgb(scheme.primary)};
      --md-sys-color-on-primary: ${hexFromArgb(scheme.onPrimary)};
      --md-sys-color-primary-container: ${hexFromArgb(scheme.primaryContainer)};
      --md-sys-color-on-primary-container: ${hexFromArgb(scheme.onPrimaryContainer)};
      --md-sys-color-secondary: ${hexFromArgb(scheme.secondary)};
      --md-sys-color-on-secondary: ${hexFromArgb(scheme.onSecondary)};
      --md-sys-color-secondary-container: ${hexFromArgb(scheme.secondaryContainer)};
      --md-sys-color-on-secondary-container: ${hexFromArgb(scheme.onSecondaryContainer)};
      --md-sys-color-tertiary: ${hexFromArgb(scheme.tertiary)};
      --md-sys-color-on-tertiary: ${hexFromArgb(scheme.onTertiary)};
      --md-sys-color-tertiary-container: ${hexFromArgb(scheme.tertiaryContainer)};
      --md-sys-color-on-tertiary-container: ${hexFromArgb(scheme.onTertiaryContainer)};
      --md-sys-color-error: ${hexFromArgb(scheme.error)};
      --md-sys-color-on-error: ${hexFromArgb(scheme.onError)};
      --md-sys-color-error-container: ${hexFromArgb(scheme.errorContainer)};
      --md-sys-color-on-error-container: ${hexFromArgb(scheme.onErrorContainer)};
      --md-sys-color-background: ${hexFromArgb(scheme.background)};
      --md-sys-color-on-background: ${hexFromArgb(scheme.onBackground)};
      --md-sys-color-surface: ${hexFromArgb(scheme.surface)};
      --md-sys-color-on-surface: ${hexFromArgb(scheme.onSurface)};
      --md-sys-color-surface-variant: ${hexFromArgb(scheme.surfaceVariant)};
      --md-sys-color-on-surface-variant: ${hexFromArgb(scheme.onSurfaceVariant)};
      --md-sys-color-outline: ${hexFromArgb(scheme.outline)};
      --md-sys-color-outline-variant: ${hexFromArgb(scheme.outlineVariant)};
    `;
  };

  const lightSurfaceContainer = `
    --md-sys-color-surface-container-lowest: ${hexFromArgb(theme.palettes.neutral.tone(100))};
    --md-sys-color-surface-container-low: ${hexFromArgb(theme.palettes.neutral.tone(96))};
    --md-sys-color-surface-container: ${hexFromArgb(theme.palettes.neutral.tone(94))};
    --md-sys-color-surface-container-high: ${hexFromArgb(theme.palettes.neutral.tone(92))};
    --md-sys-color-surface-container-highest: ${hexFromArgb(theme.palettes.neutral.tone(90))};
  `;

  const darkSurfaceContainer = `
    --md-sys-color-surface-container-lowest: ${hexFromArgb(theme.palettes.neutral.tone(4))};
    --md-sys-color-surface-container-low: ${hexFromArgb(theme.palettes.neutral.tone(10))};
    --md-sys-color-surface-container: ${hexFromArgb(theme.palettes.neutral.tone(12))};
    --md-sys-color-surface-container-high: ${hexFromArgb(theme.palettes.neutral.tone(17))};
    --md-sys-color-surface-container-highest: ${hexFromArgb(theme.palettes.neutral.tone(22))};
  `;

  const cssContent = `
    :root {
      ${getCssVars(theme.schemes.light)}
      ${lightSurfaceContainer}
    }
    .dark {
      ${getCssVars(theme.schemes.dark)}
      ${darkSurfaceContainer}
      --md-sys-color-background: #090e1a;
      --md-sys-color-surface: #0f172a;
    }
  `;

  let styleTag = document.getElementById("m3-dynamic-theme");
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "m3-dynamic-theme";
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = cssContent;
}
