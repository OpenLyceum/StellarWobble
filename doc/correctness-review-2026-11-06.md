# Correctness review — 2026-11-06

Reviewed local commit `0a81a9c`. No actionable correctness defect was confirmed in the
reviewed paths. This is a bounded review, not a guarantee that the entire app is defect-free.

## Reviewed paths

- Two-body periods, barycentric radii and velocities, radial-velocity projections and sign.
- Inclination and Earth-azimuth dependencies; top/sky-view coordinate conventions.
- Nonrelativistic spectral shifts and the labelled shift-magnification calculation.
- Orbital playback, paused stepping callbacks, parameter-triggered trace reset, Reset All.
- Observatory target changes, observing cadence and noise, residuals, cache invalidation,
  folding, and Lomb–Scargle peak selection/refinement.

The model equations agree with its circular-orbit and nonrelativistic assumptions. Its
finite-mass lower-bound solver is valid as an edge-on minimum-mass inference; describing that
value as exactly `M sin i` is an approximation when planet mass is not negligible.
No change was made for that small teaching approximation in this review.

## Validation

- Node `v26.13.0`; lint, all type checks, production build, and 72 existing tests passed,
  including orbital fixtures, period-search fixtures, state tests, and disposal tests.
- Pointer and keyboard fuzz, 10 seconds each with assertions, passed.
- All four built screens initialized and Reset All worked at 1280×800 and 390×844,
  with assertions and randomized listener order; no browser errors observed.
- Local compliance passed with warnings, and template-drift check passed. Remote GitHub
  security settings were skipped because `gh` was unavailable.

Limitations: no fresh observational-data audit, long-duration performance/heap comparison,
or manual screen-reader/educator sign-off. The synthetic Observatory data are intentionally
not actual observing measurements. Review changes are documentation only.
