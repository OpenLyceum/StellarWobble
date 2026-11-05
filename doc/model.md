# Stellar Wobble — model

This is the physics behind the sim, for teachers and maintainers. Everything is Newtonian two-body
motion on **circular** orbits plus the non-relativistic Doppler shift. The equations are standard;
see any introductory astronomy text, e.g. Wright & Gaudi, *Exoplanet Detection Methods* (2013).

## Sign convention

Positive radial velocity v<sub>r</sub> means the star is **moving away** from Earth, so its light
is **redshifted**. Every screen uses this convention: the arrows, chart tints, spectra and readouts.

## Doppler shift (Doppler screen)

For v ≪ c every wavelength is stretched by the same factor:

  λ<sub>observed</sub> = λ<sub>rest</sub> (1 + v<sub>r</sub>/c),  Δλ/λ<sub>rest</sub> = v<sub>r</sub>/c

Only the component of velocity along the line of sight counts. Sideways (transverse) motion gives
no first-order shift. The relativistic transverse Doppler effect is of order (v/c)², about 10⁻⁷ at
100 km/s and 10⁻¹⁴ at 10 m/s, so it is ignored.

The star's spectrum is a flat (continuum-normalised) continuum crossed by Gaussian absorption lines
at laboratory air wavelengths:

| Line | λ (nm) | Line | λ (nm) |
|---|---|---|---|
| Ca II K | 393.37 | Mg b | 516.73, 517.27, 518.36 |
| Ca II H | 396.85 | Fe | 527.04 |
| Hδ | 410.17 | Na D₂, D₁ | 589.00, 589.59 |
| Hγ | 434.05 | Hα | 656.28 |
| Fe | 438.35 | Hβ | 486.13 |

The depths and widths are illustrative. The full 380–700 nm strip broadens every line to
σ = 0.9 nm so that it stays visible at about 0.5 nm per pixel. The zoom windows (±1 nm) use the
intrinsic widths.

**Magnification.** A 30 m/s wobble shifts Hα by 6.6 × 10⁻⁵ nm, far less than a pixel. Each zoom
window therefore draws the shift multiplied by the largest factor of the form 1, 2 or 5 × 10ⁿ that
keeps the expected maximum within 70 % of the half-window, and it always prints that factor. The
Δλ readout always gives the real, unmagnified value.

- **Doppler screen:** the expected maximum is the slider range: ±300 km/s (factor ×1, drawn to
  scale) or ±100 m/s (×2000).
- **Wobble screen:** the expected maximum is the current K.

**Wave picture.** The picture is explicitly not to scale. The star's drawn speed is v/v<sub>max</sub> × 0.75 of the
drawn wave speed. The camera follows the star, so each wavefront is a circle centred where the star
was when it was emitted.

## Two-body orbits (Wobble, Viewing Angle)

The star (M★) and planet (M<sub>p</sub>) move on circles about their barycentre. The separation is a,
and:

- P = 2π √(a³ / G(M★ + M<sub>p</sub>)) (Kepler's third law)
- a★ = a M<sub>p</sub>/(M★ + M<sub>p</sub>), a<sub>p</sub> = a M★/(M★ + M<sub>p</sub>)
- v★ = 2π a★ / P, v<sub>p</sub> = 2π a<sub>p</sub> / P, so M★ v★ = M<sub>p</sub> v<sub>p</sub>

This is the full reduced-mass form. ExtrasolarPlanets keeps the NAAP approximation a₁ = (M<sub>p</sub>/M★)a.

**Geometry.** The orbit lies in the x–y plane and the planet's angle is θ = 2π·phase. Earth's
direction is

  ê = (sin i cos λ, sin i sin λ, cos i)

where i is the inclination (90° edge-on, 0° face-on) and λ is Earth's azimuth in the orbital plane.
The star's velocity is v★(sin θ, −cos θ, 0). Its radial velocity is

  v<sub>r</sub> = −v★·ê = K sin(λ − θ),  K = v★ sin i = (2πG/P)<sup>1/3</sup> M<sub>p</sub> sin i / (M★ + M<sub>p</sub>)<sup>2/3</sup>

The Wobble screen fixes i = 90° and λ = 270°, so Earth lies toward the bottom of the top view.
Changing λ shifts the curve's phase but not its size.

**Minimum mass.** An observer measures P and K and knows M★ from the star's spectrum. They solve
m = K (P/2πG)<sup>1/3</sup> (M★ + m)<sup>2/3</sup> for m = M<sub>p</sub> sin i by fixed-point
iteration. Since i is unknown, this is a **lower limit** on the planet's mass.

Sanity checks (in `tests/orbitPhysics.test.ts`):

- the Sun's wobble from Jupiter is K = 12.5 m/s, and from Earth 0.09 m/s;
- 51 Peg b (M★ = 1.11 M☉, M<sub>p</sub> sin i = 0.47 M<sub>J</sub>, P = 4.23 d) gives K ≈ 56 m/s;
- K = 0 face-on.

**Drawing.** Nothing in the drawing is to scale:

- The star's colour comes from T = 5772 K × (M/M☉)<sup>0.6</sup>, from L ∝ M⁴ and R ∝ M<sup>0.8</sup>.
- The drawn planet-orbit radius is logarithmic in a.
- The star's own orbit is magnified by a labelled 1-2-5 factor.

**Time.** The clock runs in orbits: one orbit takes 8 s of wall-clock time at normal speed, whatever
the period. The chart converts orbits to days with P.

## Observing (Observatory)

The true signal is v<sub>r</sub>(t) = K sin(2π(t/P − φ)), with t in days. The targets are:

| Target | M★ (M☉) | P (d) | K (m/s) | M<sub>p</sub> sin i |
|---|---|---|---|---|
| 51 Pegasi | 1.11 | 4.2308 | 55.9 | 0.47 M<sub>J</sub> |
| Sun + Jupiter | 1 | 4332.6 | 12.5 | 1 M<sub>J</sub> |
| Sun + Earth | 1 | 365.25 | 0.0895 | 1 M<sub>⊕</sub> |
| Mystery | 0.7–1.3 | 2–400 (log-uniform) | 8–200 | 0.1–10 M<sub>J</sub> true mass (log-uniform), cos i uniform |

Observing rules:

- **Nights:** consecutive nights are `cadence` days apart. Each night has a 20 % chance of cloud,
  which costs a further day, and the time of night is jittered by up to ±0.2 day.
- **Noise:** each measurement adds Gaussian noise of the chosen precision (1, 3 or 10 m/s), and that
  precision is its error bar.
- **Fit:** the user's model has the same functional form. The scatter readout is the RMS residual of
  the data about it, so a good fit gives a scatter close to the precision.
- **Fold:** folding plots each point at frac(t / P<sub>fit</sub>).
