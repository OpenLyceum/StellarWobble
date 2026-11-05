# Stellar Wobble

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Find an exoplanet the way astronomers do, with the radial-velocity (Doppler wobble) method. See
how a star's speed toward or away from us is measured from the shift of its spectral lines, watch a
planet pull its star around their common center of mass, discover why the signal depends on where
Earth stands (and vanishes for a face-on orbit), and fit noisy measurements to find the planet's
period and minimum mass. Throughout, the planet itself is never seen: everything comes from the
star's light. Written for introductory astronomy. Built with
[SceneryStack](https://scenerystack.org/); runs offline as a Progressive Web App.

## Features

- **Doppler.** A star sends light waves toward Earth while you set its radial and sideways
  velocity. The waves bunch up ahead of it and spread out behind. Its spectrum sits under a
  laboratory spectrum, and zoom windows on Hβ and Hα show each line's shift with Δλ = λ v<sub>r</sub>/c.
  Sideways motion gives no shift. Switch to planet-sized speeds (m/s) to see how tiny the real
  shifts are; any magnification of the drawn shift is always labelled.
- **Wobble.** A star and its planet orbit their center of mass, seen from above with Earth toward
  the bottom. Change the planet's mass, its distance and the star's mass. A live chart traces the
  star's radial velocity, and the Hα line swings blue and red. **Telescope view** hides the planet
  and leaves only what an astronomer gets: the star and the radial part of its motion.
- **Viewing Angle.** The orbit in 3D (drag or use the arrow keys to rotate it), with an arrow toward
  Earth that moves as you change the orbit's tilt and Earth's direction. Below it is the orbit as
  seen from Earth. The radial-velocity curve shrinks as K = v<sub>★</sub> sin i against the edge-on
  ghost, down to nothing face-on. Readouts compare the true planet mass with the minimum mass
  M<sub>p</sub> sin i that an observer would infer.
- **Observatory.** Observe a mystery star, 51 Pegasi, or the Sun as Jupiter or Earth would make it
  wobble. You get one noisy measurement per night, at a precision and cadence you choose, with
  cloudy nights. Fit a period, an amplitude and a phase, fold the data on your period, and read off
  the planet's minimum mass, then reveal the answer.
- **Accessible:**
  - Every control works from the keyboard.
  - Each screen has a live screen summary and a keyboard-help dialog.
  - Each screen has a "How does it work?" explanation.
  - English, French and Spanish.
  - Default and projector colour profiles.
  - Installable PWA.
  - A preference (or `?showEquations`) shows the equations beside the readouts.

## Quick Start

```bash
npm install
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
