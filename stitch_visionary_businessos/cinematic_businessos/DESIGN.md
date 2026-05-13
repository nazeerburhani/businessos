---
name: Cinematic BusinessOS
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#3a393a'
  surface-container-lowest: '#0e0e0f'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e5e2e3'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e3'
  inverse-on-surface: '#313031'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#d1bcff'
  on-secondary: '#3c0090'
  secondary-container: '#7000ff'
  on-secondary-container: '#ddcdff'
  tertiary: '#f6f5f5'
  on-tertiary: '#2f3131'
  tertiary-container: '#d9d9d9'
  on-tertiary-container: '#5e5f5f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#23005b'
  on-secondary-fixed-variant: '#5700c9'
  tertiary-fixed: '#e3e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#464747'
  background: '#131314'
  on-background: '#e5e2e3'
  surface-variant: '#353436'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  data-point:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding-desktop: 40px
  container-padding-mobile: 20px
  gutter: 24px
  panel-gap: 32px
---

## Brand & Style
This design system establishes an ultra-premium, futuristic enterprise environment that feels less like a traditional dashboard and more like a high-end command deck. The personality is **intelligent, immersive, and luxurious**, targeting high-level decision-makers who require both data clarity and an evocative aesthetic experience.

The visual style is a hybrid of **Glassmorphism** and **Futuristic Minimalism**. It utilizes deep, dark base layers (Deep Black and Dark Graphite) to create an infinite canvas, upon which holographic, translucent cards and floating panels are layered. Visual depth is achieved through liquid gradients and soft ambient glows, suggesting a UI that is powered by light rather than pigment.

## Colors
The palette is rooted in a **Deep Dark Mode**. The foundation uses `Deep Black` (#050505) for core backgrounds and `Dark Graphite` (#121214) for structural elements. 

- **Primary & Secondary:** `Electric Blue` and `Neon Cyan` serve as the primary interactive drivers, while `Soft Purple` ambient glows provide a sense of "active energy" behind panels.
- **Accents:** `Silver Glass` highlights (#E2E8F0 at low opacity) define edges and simulate light refraction on glass surfaces.
- **Functional:** Status colors are high-saturation emeralds, oranges, and reds, ensuring critical business metrics remain legible against the dark, high-contrast backdrop.

## Typography
The typography strategy blends geometric futurism with technical precision. 
- **Headlines:** Use `Space Grotesk` for its wide, cutting-edge personality. Tight letter-spacing and heavy weights are reserved for large-scale display data.
- **Body:** `Geist` provides a clean, technical, and highly legible experience for long-form data and enterprise descriptions.
- **Technical/Labels:** `JetBrains Mono` is used for metadata, status labels, and small data points to evoke a "system-level" OS feel, emphasizing the intelligence of the platform.

## Layout & Spacing
The system utilizes a **Fluid Command Grid**. While the layout adapts to fill the screen, it treats the screen as a single unified "cockpit" rather than a scrolling page.

- **Grid:** A 12-column grid with generous 24px gutters. 
- **Margins:** Desktop views utilize large 40px external margins to create a "floating" effect for the central OS interface.
- **Hierarchy:** Spacing is used to group "floating layered panels." Related data clusters should have tight internal padding (16-20px), while separate functional modules should have wide gaps (32px+) to maintain the cinematic, airy feel.

## Elevation & Depth
Depth is the cornerstone of this design system. It is communicated through **Optical Stacking** rather than traditional dropshadows.

1.  **Base Layer:** Solid Deep Black (#050505).
2.  **Ambient Layer:** Soft, large-radius purple or cyan blurs that appear "under" the glass but "above" the base.
3.  **Glass Layer:** Translucent panels with `backdrop-filter: blur(20px)` and a subtle 1px border colored with a gradient from `Silver Glass` to `Transparent`.
4.  **Active Layer:** Floating elements with a high-intensity neon "inner glow" or "rim light" effect on the top-left edge to simulate a holographic light source.

## Shapes
The shape language is **Soft-Tech**. Elements use a consistent `0.25rem` (4px) base radius to maintain a professional, sharp, and architectural feel. Larger containers and floating cards scale up to `0.75rem` (12px) to soften the cinematic look and prevent the UI from feeling too aggressive or "brutalist." Interactive components like buttons should maintain the sharper 4px radius for a precision-tool aesthetic.

## Components
- **Floating Panels:** These are the primary containers. They must feature a 20-40px background blur and a 1px silver-to-transparent border. 
- **Buttons:** Primary buttons use a solid `Neon Cyan` to `Electric Blue` liquid gradient. Secondary buttons are ghost-style with a thin glass border and subtle hover glow.
- **Holographic Cards:** Small data widgets that use 10% opacity fills. When hovered, the background blur should increase, and the border should "light up" with a primary color pulse.
- **Input Fields:** Dark, recessed backgrounds with a bottom-only neon highlight that expands when focused.
- **Status Chips:** High-saturation text with a very low-opacity background tint of the same color, encased in a hairline border.
- **Liquid Progress Bars:** Data visualizations should use smooth gradients and "glowing heads" on the progress indicator to feel like live energy flowing through the system.