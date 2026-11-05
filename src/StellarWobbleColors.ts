/**
 * StellarWobbleColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import StellarWobbleColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import StellarWobbleColors from "../../StellarWobbleColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: StellarWobbleColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the StellarWobbleColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import StellarWobbleNamespace from "./StellarWobbleNamespace.js";

const StellarWobbleColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  /** Secondary text: captions, "not to scale" notes, units. */
  mutedTextColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "mutedText", {
    default: "#9aa4b8",
    projector: "#555555",
  }),

  // ── Space scenes ─────────────────────────────────────────────────────────────

  /** Fill of the space views (orbit view, Doppler wave view). */
  spaceColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "space", {
    default: "#05070f",
    projector: "#eef1f7",
  }),

  /** Border of the space views. */
  spaceBorderColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "spaceBorder", {
    default: "#2c3a5a",
    projector: "#9aa4b8",
  }),

  /** Background stars drawn in the space views. */
  backgroundStarColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "backgroundStar", {
    default: "#c8d0e0",
    projector: "#9aa4b8",
  }),

  /** The planet disc. */
  planetColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "planet", {
    default: "#6fb3ff",
    projector: "#1f5fbf",
  }),

  /** Orbit paths. */
  orbitPathColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "orbitPath", {
    default: "#5c6b8a",
    projector: "#8a94a8",
  }),

  /** The star's own (magnified) orbit about the barycentre. */
  starOrbitPathColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "starOrbitPath", {
    default: "#ffcf5c",
    projector: "#b07800",
  }),

  /** Barycentre (centre-of-mass) marker. */
  barycenterColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "barycenter", {
    default: "#ff5ca8",
    projector: "#c2185b",
  }),

  /** Direction-to-Earth arrow and Earth icon. */
  earthColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "earth", {
    default: "#3fd19a",
    projector: "#0b7a52",
  }),

  /** Expanding wavefronts in the Doppler view. */
  wavefrontColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "wavefront", {
    default: "rgba(255,230,160,0.55)",
    projector: "rgba(176,120,0,0.6)",
  }),

  // ── Velocity arrows ──────────────────────────────────────────────────────────

  /** The star's full velocity. */
  velocityColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "velocity", {
    default: "#c792ea",
    projector: "#6a1b9a",
  }),

  /** Motion away from Earth (redshift). */
  redshiftColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "redshift", {
    default: "#ff6b5c",
    projector: "#c62828",
  }),

  /** Motion toward Earth (blueshift). */
  blueshiftColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "blueshift", {
    default: "#5cb8ff",
    projector: "#1565c0",
  }),

  /** Sideways (across-the-sky) component, which causes no shift. */
  transverseColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "transverse", {
    default: "#a0a0a0",
    projector: "#777777",
  }),

  // ── Spectra ──────────────────────────────────────────────────────────────────

  /** Frame drawn around spectrum strips. */
  spectrumFrameColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "spectrumFrame", {
    default: "#8090b0",
    projector: "#555555",
  }),

  /** Dashed marker at a line's laboratory (rest) wavelength. */
  restMarkerColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "restMarker", {
    default: "#ffffff",
    projector: "#222222",
  }),

  /** Line profile (intensity vs wavelength) curve under a zoomed line. */
  profileColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "profile", {
    default: "#ffd36b",
    projector: "#8a5a00",
  }),

  // ── Charts ───────────────────────────────────────────────────────────────────

  chartBackgroundColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "chartBackground", {
    default: "#0b1020",
    projector: "#ffffff",
  }),

  chartAxisColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "chartAxis", {
    default: "#8090b0",
    projector: "#333333",
  }),

  chartGridColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "chartGrid", {
    default: "#1f2a44",
    projector: "#dddddd",
  }),

  /** Zero line of a radial-velocity chart. */
  chartZeroLineColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "chartZeroLine", {
    default: "#56648a",
    projector: "#888888",
  }),

  /** The star's radial-velocity curve. */
  rvCurveColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "rvCurve", {
    default: "#ffcf5c",
    projector: "#b07800",
  }),

  /** Ghost curve: the signal an edge-on observer would see. */
  ghostCurveColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "ghostCurve", {
    default: "rgba(255,207,92,0.35)",
    projector: "rgba(176,120,0,0.35)",
  }),

  /** Measured data points. */
  measurementColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "measurement", {
    default: "#e8ecf5",
    projector: "#222222",
  }),

  /** The user's fitted model curve. */
  fitCurveColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "fitCurve", {
    default: "#3fd19a",
    projector: "#0b7a52",
  }),

  /** The true (revealed) curve. */
  answerCurveColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "answerCurve", {
    default: "#ff5ca8",
    projector: "#c2185b",
  }),

  /** Time / phase cursor on a chart. */
  cursorColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "cursor", {
    default: "#ffffff",
    projector: "#222222",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(StellarWobbleNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),
};

export default StellarWobbleColors;
