# AGENTS.md — Stellar Wobble

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

This sim teaches exoplanet detection by the **radial-velocity (Doppler wobble) method** to an
introductory astronomy audience. It is original work, not a port, and was forked from
`SceneryStackTemplate` on 5 Nov 2026. It complements `ExtrasolarPlanets`, a NAAP port whose Radial
Velocity screen has no spectrum and no Doppler explanation. Its companion for the transit method is `TransitHunter`, whose
Rock or Gas? screen turns these wobbles into true masses. Four screens:

| Screen | Folder | Content |
|---|---|---|
| Doppler | `src/doppler/` | A star with radial + sideways velocity; wavefronts; lab vs star spectrum; Hβ/Hα zoom windows with Δλ; fast-star (km/s) or planet-sized (m/s) speeds |
| Wobble | `src/wobble/` | Star + planet about the barycentre, top view, Earth at the bottom; live RV chart; Hα zoom; telescope view hides the planet |
| Viewing Angle | `src/viewing-angle/` | 3-D orbit with a movable To Earth arrow (inclination, Earth direction), orbit seen from Earth, RV over one orbit vs edge-on ghost, true vs minimum mass |
| Observatory | `src/observatory/` | Observe a target nightly with noise (optional stellar jitter); zoom/scroll the time axis; periodogram; fit period/amplitude/phase; fold; scatter in error bars; infer minimum mass; reveal |

Physics and data: [`doc/model.md`](doc/model.md). Architecture and decisions:
[`doc/implementation-notes.md`](doc/implementation-notes.md).

### Things to know first

- **Sign convention:** positive radial velocity means the star is moving away, which is a redshift.
  On the Wobble screen Earth is toward model −y, the bottom of the top view.
- **Orbits are circular.** `OrbitalSystem` and the Observatory signals have no eccentricity
  (ExtrasolarPlanets covers eccentric orbits). The star's orbit uses the exact barycentric form, not
  the NAAP approximation.
- **Exaggerations are always labelled:**
  - The zoomed shift, the star's orbit and the wave picture are not to scale.
  - Each one prints its factor, chosen in 1-2-5 steps by `shiftMagnification`.
  - The Δλ readout always gives the real shift.
  - Keep it that way.
- **The clock runs in orbits:** 8 s of wall-clock time per orbit at normal speed. The live trace is
  a sweep that restarts after `TRACE_ORBITS`, so chart ranges do not change every frame.
- **Node >=26** is required. Run `source ~/.nvm/nvm.sh && nvm use 26` before npm or a git commit
  (the pre-commit hook runs npm).

## Key files

| File | Purpose |
|---|---|
| `src/common/model/orbitPhysics.ts` | Period, barycentric radii and speeds, K, minimum mass, direction to Earth, closed-form RV |
| `src/common/model/stellarSpectrum.ts` | Absorption lines, Doppler shift, spectrum intensity, magnification factor |
| `src/common/model/OrbitalSystem.ts` | Shared model of Wobble and Viewing Angle |
| `src/common/view/SpectralLineZoomNode.ts` | The zoom window that makes the shift visible |
| `src/common/view/controls.ts` | Number controls (log scale), checkboxes, explanation dialog button, equation node |
| `src/observatory/model/PlanetSignal.ts` | Target signals (seven real short-period planets from the NASA Exoplanet Archive, Sun + Jupiter, Sun + Earth, random mystery) |
| `src/observatory/model/periodogram.ts` | Lomb–Scargle periodogram (rotation recurrence) and golden-section peak refinement |
| `src/observatory/view/PeriodogramNode.ts` | Periodogram chart drawn in place of the measurements; click a peak or "Use highest peak" |
| `src/observatory/view/timeWindow.ts` | Zoom and scroll limits of the Observatory chart's time axis (view state lives in `ObservatoryChartNode`, null = show all) |
| `src/preferences/StellarWobblePreferencesModel.ts` | `stellarWobblePreferences` singleton: Show equations (`?showEquations`) |

## Accessibility

Standard fleet pattern:

- Per-screen a11y strings live under `a11y.<screenKey>` in each locale JSON, reached via
  `StringManager.get<Screen>A11yStrings()`. Visible strings are reached via
  `get<Screen>Strings()` and `getCommonStrings()`.
- Every screen has a live `*ScreenSummaryContent`, a wrapper `Node` with `pdomOrder` (Reset All
  last), and a `*KeyboardHelpContent` wired through the Screen.
- The 3-D orbit view is focusable and rotates with the arrow keys. Its keyboard-help section is
  custom.
- Numbers in descriptions go through `toPlainText` (no rich-text markup).

## Compliance carve-outs

- **Hardcoded colors (computed spectrum colours).** `SpectrumStripNode.paintCanvas` builds an `rgb(...)` fill per pixel
  column from `VisibleColor.wavelengthToColor` scaled by brightness. These are physical colours of
  light, not theme colours, so they do not belong in `StellarWobbleColors.ts`. LightAndAtoms does the
  same.

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

For screenshots, run the dev server with `npx vite --port <free port>`. Screen models are reachable
from the console as `phet.joist.sim.screens[i].model` (with `?screens=n`, at index 0).
