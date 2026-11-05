# Stellar Wobble — implementation notes

This note covers architecture and decisions; the physics is in [model.md](model.md).

## Layout

```
src/
  StellarWobble{Colors,Constants,Namespace}.ts   colours (with default + projector), constants (SI), namespace
  common/
    model/orbitPhysics.ts       pure two-body + line-of-sight functions (no SceneryStack beyond Vector3)
    model/stellarSpectrum.ts    absorption lines, Doppler shift, spectrum intensity, magnification factor
    model/starAppearance.ts     temperature / radius / blackbody colour from mass (drawing only)
    model/OrbitalSystem.ts      shared model of Wobble + Viewing Angle (Properties, clock in orbits, RV trace)
    view/SpectrumStripNode.ts   canvas strip painted per pixel column from an intensity function
    view/FullSpectrumNode.ts    380–700 nm lab + star strips, line labels, zoom boxes
    view/SpectralLineZoomNode.ts  ±1 nm window: strips, profile, rest marker, shift arrow, Δλ, magnification
    view/ChartFrameNode.ts      bamboo chart frame (copied from RelativisticDynamics)
    view/controls.ts            createNumberControl (log scale), createCheckbox, explanation button, equation node
    view/formatters.ts          periods, speeds, planet masses with localized units
    view/StarNode.ts            glowing star coloured by temperature
  doppler/        DopplerModel (two speed scales), WaveViewNode (camera-follows-star wavefronts)
  wobble/         WobbleModel (OrbitalSystem edge-on), TopViewNode, LiveRVChartNode
  viewing-angle/  ViewingAngleModel (+ minimum mass), Orbit3DViewNode, SkyViewNode, PhaseRVChartNode
  observatory/    ObservatoryModel, ObservatoryTarget (enumeration), PlanetSignal, ObservatoryChartNode
  preferences/    one preference: Show equations (?showEquations), a module-level singleton
```

## Decisions

- **Separate from ExtrasolarPlanets.** That sim is a faithful NAAP port and keeps the NAAP
  approximations, including eccentric orbits. This sim teaches the Doppler measurement, the geometry
  and "we see the star, not the planet", so it keeps orbits circular and uses the exact barycentric
  form.
- **The clock runs in orbits, not seconds.** Periods range from about a day to about 11 years, and
  one orbit always takes 8 s of wall-clock time at normal speed. The live chart uses days via P. The
  trace is a sweep: after `TRACE_ORBITS` it restarts from the left, so chart ranges change only when
  the parameters change, never every frame.
- **Magnification is explicit.** Every place that exaggerates the drawing (the zoomed shift, the
  star's orbit, the wave picture) labels the exaggeration on screen. The factors come from
  `shiftMagnification` (1-2-5 steps).
- **The Viewing Angle view moves Earth, not the orbit.** The orbit is fixed in the 3-D scene and the
  "To Earth" arrow follows i and λ, so the screen is about where we stand. The camera is
  orthographic, drawn with plain Paths, and rotated by dragging the background or with the arrow
  keys (the view node is focusable).
- **Observatory residual uses null for "no data".** `NumberProperty` rejects NaN, so the residual is
  `Property<number | null>`.
- **Preferences are a module-level singleton** (`stellarWobblePreferences`). `main.ts` passes it to
  the Preferences dialog and the views read it through `createEquationNode`.

## Testing

- `tests/orbitPhysics.test.ts` and `tests/stellarSpectrum.test.ts` check the physics against known
  systems.
- `tests/OrbitalSystem.test.ts` checks momentum balance, sin i scaling, the clock and the trace
  sweep.
- `tests/timeWindow.test.ts` checks the Observatory chart's zoom and scroll limits.
- `tests/ObservatoryModel.test.ts` checks the real targets' minimum masses against the archive, the noise statistics and resets.
- `tests/memory-leak.test.ts` covers the shared model and the spectrum and star nodes.

Fuzz with `npm run test:fuzz`. In the dev console the screen models are
`phet.joist.sim.screens[i].model`, at index 0 when the URL has `?screens=n`.
