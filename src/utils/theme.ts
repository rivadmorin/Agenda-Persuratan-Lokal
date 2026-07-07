import { argbFromHex, Scheme, CorePalette, TonalPalette, hexFromArgb, Hct } from "@material/material-color-utilities";

export interface ColorSchemeOption {
  id: string;
  chroma: number;
  tone: number;
}

export const colorSchemes: ColorSchemeOption[] = [
  { id: 'vibrant', chroma: 48, tone: 40 },
  { id: 'pastel', chroma: 24, tone: 52 },
  { id: 'muted', chroma: 14, tone: 42 },
  { id: 'deep', chroma: 68, tone: 34 },
  { id: 'neon', chroma: 88, tone: 48 },
  { id: 'monochrome', chroma: 0, tone: 40 }
];

export function generateM3Theme(seedColor: string, customBg?: string, customDarkBg?: string, schemeId?: string) {
  const argb = argbFromHex(seedColor);
  const corePalette = CorePalette.of(argb);
  
  if (schemeId) {
    const schemeOption = colorSchemes.find(s => s.id === schemeId);
    if (schemeOption) {
      const chroma = schemeOption.chroma;
      const hct = Hct.fromInt(argb);
      const hue = hct.hue;
      
      corePalette.a1 = TonalPalette.fromHueAndChroma(hue, chroma);
      corePalette.a2 = TonalPalette.fromHueAndChroma(hue, Math.max(4, chroma / 3));
      corePalette.a3 = TonalPalette.fromHueAndChroma(hue + 60, Math.max(4, chroma / 2));
      
      if (chroma === 0) {
        corePalette.n1 = TonalPalette.fromHueAndChroma(hue, 0);
        corePalette.n2 = TonalPalette.fromHueAndChroma(hue, 0);
      }
    }
  }

  const lightScheme = Scheme.lightFromCorePalette(corePalette);
  const darkScheme = Scheme.darkFromCorePalette(corePalette);

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
    --md-sys-color-surface-container-lowest: ${hexFromArgb(corePalette.n1.tone(100))};
    --md-sys-color-surface-container-low: ${hexFromArgb(corePalette.n1.tone(96))};
    --md-sys-color-surface-container: ${hexFromArgb(corePalette.n1.tone(94))};
    --md-sys-color-surface-container-high: ${hexFromArgb(corePalette.n1.tone(92))};
    --md-sys-color-surface-container-highest: ${hexFromArgb(corePalette.n1.tone(90))};
  `;

  const darkSurfaceContainer = `
    --md-sys-color-surface-container-lowest: ${hexFromArgb(corePalette.n1.tone(4))};
    --md-sys-color-surface-container-low: ${hexFromArgb(corePalette.n1.tone(10))};
    --md-sys-color-surface-container: ${hexFromArgb(corePalette.n1.tone(12))};
    --md-sys-color-surface-container-high: ${hexFromArgb(corePalette.n1.tone(17))};
    --md-sys-color-surface-container-highest: ${hexFromArgb(corePalette.n1.tone(22))};
  `;

  const cssContent = `
    :root {
      ${getCssVars(lightScheme)}
      ${lightSurfaceContainer}
      ${customBg ? `
        --md-sys-color-background: ${customBg};
        --md-sys-color-surface: color-mix(in srgb, ${customBg} 98%, black);
        --md-sys-color-surface-container-lowest: color-mix(in srgb, ${customBg} 100%, white);
        --md-sys-color-surface-container-low: color-mix(in srgb, ${customBg} 96%, black);
        --md-sys-color-surface-container: color-mix(in srgb, ${customBg} 94%, black);
        --md-sys-color-surface-container-high: color-mix(in srgb, ${customBg} 91%, black);
        --md-sys-color-surface-container-highest: color-mix(in srgb, ${customBg} 87%, black);
      ` : ''}
    }
    .dark {
      ${getCssVars(darkScheme)}
      ${darkSurfaceContainer}
      --md-sys-color-background: ${customDarkBg || '#090e1a'};
      ${customDarkBg ? `
        --md-sys-color-surface: color-mix(in srgb, ${customDarkBg} 94%, white);
        --md-sys-color-surface-container-lowest: color-mix(in srgb, ${customDarkBg} 80%, black);
        --md-sys-color-surface-container-low: color-mix(in srgb, ${customDarkBg} 94%, white);
        --md-sys-color-surface-container: color-mix(in srgb, ${customDarkBg} 91%, white);
        --md-sys-color-surface-container-high: color-mix(in srgb, ${customDarkBg} 86%, white);
        --md-sys-color-surface-container-highest: color-mix(in srgb, ${customDarkBg} 81%, white);
      ` : `
        --md-sys-color-background: #090e1a;
        --md-sys-color-surface: #0f172a;
      `}
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
