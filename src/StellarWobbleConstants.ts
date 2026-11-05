/**
 * StellarWobbleConstants.ts
 *
 * Every named numeric constant used across the simulation: physical constants
 * and parameter ranges (SI unless the name says otherwise), and layout values
 * in screen pixels. Colours live in StellarWobbleColors.ts.
 */

import { Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import StellarWobbleNamespace from "./StellarWobbleNamespace.js";

// ── Physical constants (SI) ───────────────────────────────────────────────────

/** Newtonian gravitational constant, m³ kg⁻¹ s⁻². */
export const G_SI = 6.674e-11;

/** Speed of light in vacuum, m/s. */
export const SPEED_OF_LIGHT = 299_792_458;

/** Solar mass, kg. */
export const SUN_MASS_KG = 1.989e30;

/** Jupiter mass, kg. */
export const JUPITER_MASS_KG = 1.898e27;

/** Earth mass, kg. */
export const EARTH_MASS_KG = 5.972e24;

/** Astronomical unit, m. */
export const AU_M = 1.496e11;

/** One day, s. */
export const DAY_S = 86_400;

/** Solar effective temperature, K. */
export const SUN_TEMPERATURE_K = 5772;

// ── Orbital-system parameter ranges (display units) ───────────────────────────

/** Star mass, solar masses. */
export const STAR_MASS_RANGE = new Range(0.5, 1.5);
export const STAR_MASS_DEFAULT = 1;

/** Planet mass, Jupiter masses (1 Earth mass ≈ 0.00315 M_J up to the 13 M_J deuterium limit). */
export const PLANET_MASS_RANGE = new Range(0.003, 13);
export const PLANET_MASS_DEFAULT = 1;

/** Star–planet distance (semi-major axis of the relative orbit), AU. */
export const DISTANCE_RANGE = new Range(0.05, 5);
export const DISTANCE_DEFAULT = 1;

/** Inclination of the orbit to the sky plane, degrees (0 = face-on, 90 = edge-on). */
export const INCLINATION_RANGE = new Range(0, 90);

/** Direction of Earth within the orbital plane, degrees. */
export const EARTH_AZIMUTH_RANGE = new Range(0, 360);

/**
 * Earth's azimuth on the Wobble screen, degrees: Earth lies toward the bottom
 * of the top view (model −y).
 */
export const WOBBLE_EARTH_AZIMUTH = 270;

/** Wall-clock seconds for one orbit at normal speed (the clock is scaled per orbit). */
export const SECONDS_PER_ORBIT = 8;

/** Speed multipliers of the time control. */
export const SLOW_SPEED_FACTOR = 0.25;
export const FAST_SPEED_FACTOR = 3;

/** Orbits of radial-velocity history shown on the live chart. */
export const TRACE_ORBITS = 2;

/** Samples recorded per orbit on the live chart. */
export const TRACE_SAMPLES_PER_ORBIT = 120;

// ── Doppler screen ────────────────────────────────────────────────────────────

/** Velocity range of a fast-moving star (the default scale), km/s. */
export const STAR_SPEED_RANGE_KMS = new Range(-300, 300);

/** Velocity range of a star wobbling because of a planet, m/s. */
export const WOBBLE_SPEED_RANGE_MS = new Range(-100, 100);

/**
 * Display speed of the star as a fraction of the drawn wave speed when the
 * slider is at its maximum. The wave picture is not to scale: it exaggerates
 * v/c so the bunching of the waves is visible.
 */
export const MAX_DISPLAY_BETA = 0.75;

/** Wave picture: drawn wave speed (px/s) and emission period (s). */
export const WAVE_DISPLAY_SPEED = 90;
export const WAVE_EMISSION_PERIOD = 0.45;

/** Star display speed at the maximum slider value, px/s. */
export const MAX_STAR_DISPLAY_SPEED = MAX_DISPLAY_BETA * WAVE_DISPLAY_SPEED;

// ── Spectra ───────────────────────────────────────────────────────────────────

/** Wavelength span of the full spectrum strip, nm. */
export const FULL_SPECTRUM_RANGE_NM = new Range(380, 700);

/** Gaussian σ the full strip draws each line with, nm (the lines are too narrow to show otherwise). */
export const FULL_SPECTRUM_LINE_SIGMA_NM = 0.9;

/** Half-width of a zoomed line window, nm. */
export const ZOOM_HALF_WIDTH_NM = 1;

/** Largest drawn shift in a zoom window, as a fraction of its half-width, before magnification steps down. */
export const ZOOM_MAX_SHIFT_FRACTION = 0.7;

// ── Observatory ───────────────────────────────────────────────────────────────

/** Instrument precisions offered (1σ noise of one measurement), m/s. */
export const INSTRUMENT_PRECISIONS_MS = [1, 3, 10] as const;

/** Fit-slider ranges. */
export const FIT_PERIOD_RANGE_DAYS = new Range(1, 5000);
export const FIT_AMPLITUDE_RANGE_MS = new Range(0, 250);

/** Days between observations, range for the cadence slider. */
export const CADENCE_RANGE_DAYS = new Range(1, 200);

/** Most measurements kept on the chart (older ones are dropped). */
export const MAX_MEASUREMENTS = 300;

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 15;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Width of the right-hand control panels. */
export const CONTROL_PANEL_WIDTH = 230;

/** Shared fonts. */
export const FONTS = {
  TITLE: new PhetFont({ size: 15, weight: "bold" }),
  LABEL: new PhetFont(13),
  SMALL: new PhetFont(11),
  READOUT: new PhetFont(13),
  AXIS_LABEL: new PhetFont(13),
  TICK_LABEL: new PhetFont(11),
  EXPLANATION: new PhetFont(15),
} as const;

StellarWobbleNamespace.register("StellarWobbleConstants", {
  G_SI,
  SPEED_OF_LIGHT,
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
});
