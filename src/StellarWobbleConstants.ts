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

/** Mean length of a year used for period display, days. */
export const DAYS_PER_YEAR = 365.25;

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
const MAX_DISPLAY_BETA = 0.75;

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

/** Fit-slider ranges (both sliders are logarithmic). */
export const FIT_PERIOD_RANGE_DAYS = new Range(1, 5000);
export const FIT_AMPLITUDE_RANGE_MS = new Range(0.05, 300);

/**
 * Arrow-button steps of the fit sliders, in decades. The period step is 0.012 %,
 * so one click shifts a fit by under 1 % of an orbit even across the 300 nights
 * the chart keeps (a coarser step left the best fit between two clicks).
 */
export const FIT_PERIOD_STEP_DECADES = 0.00005;
export const FIT_AMPLITUDE_STEP_DECADES = 0.002;

/**
 * Extra scatter from the star itself (convection, spots and oscillations on its
 * surface), m/s, when "Stellar jitter" is on. Quiet Sun-like stars show about
 * 1–2 m/s; active stars much more. The error bars do not include it.
 */
export const STELLAR_JITTER_MS = 2;

/** Periodogram: trials per peak width, most trial frequencies, and fewest measurements. */
export const PERIODOGRAM_OVERSAMPLING = 5;
export const PERIODOGRAM_MAX_FREQUENCIES = 40_000;
export const PERIODOGRAM_MIN_MEASUREMENTS = 5;

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

/** Settings for common/StellarWobbleControlOptions.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STELLAR_WOBBLE_CONTROL_OPTIONS_SETTINGS = {
  SLIDER_THUMB_SIZE_WIDTH: 12,
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  CHECKBOX_BOX_WIDTH: 16,
  /** Stellar wobble number control options scale (dimensionless). */
  STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  STELLAR_WOBBLE_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/StellarWobblePanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STELLAR_WOBBLE_PANEL_SETTINGS = {
  OPTIONS_X_MARGIN: 12,
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/StellarWobbleScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS = {
  CONTENT_HEIGHT: 46, // px
  STAR_X_OFFSET: -30, // px
  PLANET_X_OFFSET: 150, // px
  CROSS_X_SEGMENT_2: 12, // px
  CROSS_Y_SEGMENT_2: 12, // px
  CROSS_X_MOVE_TO_Y: 12, // px
  PLANET_RADIUS_SEGMENT_2: 16, // px
  PLANET_X_OFFSET_SEGMENT_2: 120, // px
  PLANET_Y_OFFSET: -37, // px

  PLANET_ORBIT_LINE_DASH_DASH: 12, // px
  CREATE_WOBBLE_ICON_PLANET_ORBIT_LINE_DASH_DASH: 10, // px
  STAR_ORBIT_LINE_DASH_DASH: 6, // px
  ORBIT_LINE_DASH_DASH: 12, // px
  CREATE_VIEWING_ANGLE_ICON_ORBIT_LINE_DASH_DASH: 10, // px

  SPECTRUM_STRIP_WIDTH: 10,
  STAR_Y: 140,
  WAVE_PATH_LINE_WIDTH: 5,
  MOTION_START_Y: 110,
  MOTION_END_Y: 30,
  MOTION_HEAD_HEIGHT: 26,
  MOTION_HEAD_WIDTH: 32,
  MOTION_TAIL_WIDTH: 10,
  PLANET_ORBIT_RADIUS: 150,
  PLANET_ORBIT_LINE_WIDTH: 4,
  STAR_ORBIT_RADIUS: 30,
  STAR_ORBIT_LINE_WIDTH: 4,
  PLANET_RADIUS: 18,
  CROSS_X: -12,
  CROSS_Y: -12,
  CROSS_LINE_WIDTH: 6,
  PLANE_RADIUS_X: 190,
  PLANE_RADIUS_Y: 60,
  /** Plane opacity (dimensionless). */
  PLANE_OPACITY: 0.35,
  ORBIT_RADIUS_X: 170,
  ORBIT_RADIUS_Y: 52,
  ORBIT_LINE_WIDTH: 4,
  EARTH_ARROW_END_X: 70,
  EARTH_ARROW_END_Y: 55,
  EARTH_ARROW_HEAD_HEIGHT: 34,
  EARTH_ARROW_HEAD_WIDTH: 40,
  EARTH_ARROW_TAIL_WIDTH: 12,
  EARTH_RADIUS: 22,
  EARTH_X: 45,
  EARTH_Y: 35,
  LEFT: 50,
  FIT_LINE_WIDTH: 7,
  AXIS_LINE_WIDTH: 3,
  POINTS_LINE_WIDTH: 3,
  POINTS_RADIUS: 10,
} as const;

/** Settings for common/view/ChartFrameNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHART_FRAME_NODE_SETTINGS = {
  PLACE_AXIS_LABELS_TOP_OFFSET: 20, // px

  RIGHT_RIGHT: -32,
} as const;

/** Settings for common/view/FullSpectrumNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FULL_SPECTRUM_NODE_SETTINGS = {
  LAB_LABEL_X_OFFSET: -4, // px
  STAR_LABEL_X_OFFSET: -4, // px

  LABEL_OPTIONS_MAX_WIDTH_OFFSET: 4, // px
  CONSTRUCTOR_TOP_OFFSET: 5, // px

  /** Width reserved for the lab/star labels, px. */
  LABEL_COLUMN: 36,
  /** Wavelength tick spacing along the spectrum strip, nm. */
  TICK_SPACING_NM: 50,
  STRIP_HEIGHT: 18,
  LINE_LABEL_TOP: 20,
  ZOOM_BOXES_LINE_WIDTH: 1.5,
} as const;

/** Settings for common/view/SpectralLineZoomNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SPECTRAL_LINE_ZOOM_NODE_SETTINGS = {
  LAB_LABEL_X_OFFSET: -4, // px
  STAR_LABEL_X_OFFSET: -4, // px
  SHIFT_VALUE_PROPERTY_DIGITS: 2, // digits

  LABEL_OPTIONS_MAX_WIDTH_OFFSET: 4, // px
  REST_MARKER_LINE_DASH_DASH: 3, // px
  PLACE_READOUTS_TOP_OFFSET: 14, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 4, // px

  /** Width reserved for the lab/star labels, px. */
  LABEL_COLUMN: 34,
  /** Vertical gap between the lab and star strips, px. */
  GAP: 3,
  LAB_TOP: 22,
  PROFILE_FRAME_LINE_WIDTH: 0.5,
  PROFILE_PATH_LINE_WIDTH: 1.5,
  SHIFT_ARROW_HEAD_HEIGHT: 7,
  SHIFT_ARROW_HEAD_WIDTH: 8,
  SHIFT_ARROW_TAIL_WIDTH: 2,
} as const;

/** Settings for common/view/SpectrumStripNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SPECTRUM_STRIP_NODE_SETTINGS = {
  /** Display gamma: VisibleColor values are already encoded, so scale them by brightness^(1/γ). */
  DISPLAY_GAMMA: 2.2,
} as const;

/** Settings for common/view/chartUtils.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CHART_UTILS_SETTINGS = {
  DEFAULT_DIGITS: 3,
} as const;

/** Settings for common/view/controls.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const CONTROLS_SETTINGS = {
  CREATE_NUMBER_CONTROL_MAX_WIDTH_VARIANT_2: 110, // px

  PARAGRAPHS_LINE_WRAP: 600, // px

  DIALOG_TITLE_FONT_SIZE: 20,
  CREATE_NUMBER_CONTROL_MAX_WIDTH: 130,
  CREATE_CHECKBOX_MAX_WIDTH: 180,
  /** Create explanation button scale (dimensionless). */
  CREATE_EXPLANATION_BUTTON_SCALE: 0.6,
  CREATE_EXPLANATION_BUTTON_SPACING: 14,
  CREATE_EXPLANATION_BUTTON_MAX_WIDTH: 600,
  DEFAULT_MAX_WIDTH: 220,
} as const;

/** Settings for common/view/formatters.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const FORMATTERS_SETTINGS = {
  FORMAT_PERIOD_DIGITS: 3, // digits
  FORMAT_PLANET_MASS_DIGITS: 3, // digits

  DEFAULT_DIGITS: 3,
} as const;

/** Settings for doppler/model/DopplerModel.ts. */
export const DOPPLER_MODEL_SETTINGS = {
  /** Radial velocity kms default (km/s). */
  RADIAL_VELOCITY_KMS_DEFAULT: 100,
  /** Radial velocity ms default (m/s). */
  RADIAL_VELOCITY_MS_DEFAULT: 30,
} as const;

/** Settings for doppler/view/DopplerScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const DOPPLER_SCREEN_VIEW_SETTINGS = {
  VELOCITY_TEXT_DIGITS: 3, // digits
  EQUATION_VALUES_DIGITS: 2, // digits

  CONSTRUCTOR_TOP_OFFSET: 10, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px
  EXPLANATION_LABEL_MAX_WIDTH_OFFSET: 40, // px
  CONSTRUCTOR_READOUT_PANEL_SPACING: 8, // px
  READOUT_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_RIGHT_OFFSET: 30, // px

  WAVE_VIEW_WIDTH: 560,
  WAVE_VIEW_HEIGHT: 250,
  ZOOM_WIDTH: 230,
  ZOOMS_SPACING: 24,
  /** Kms control options delta (dimensionless). */
  KMS_CONTROL_OPTIONS_DELTA: 10,
  KMS_CONTROLS_SPACING: 8,
  MS_CONTROLS_SPACING: 8,
  CONTROL_PANEL_SPACING: 10,
  READOUT_PANEL_SPACING: 6,
  RIGHT_COLUMN_SPACING: 10,
} as const;

/** Settings for doppler/view/WaveViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const WAVE_VIEW_NODE_SETTINGS = {
  CONSTRUCTOR_LEFT_OFFSET: 10, // px
  CONSTRUCTOR_CENTER_Y_OFFSET: 28, // px
  LINE_OF_SIGHT_LINE_DASH_DASH: 5, // px
  NOTE_MAX_WIDTH_OFFSET: 16, // px

  /** Length of a velocity arrow at the maximum slider value, px. */
  MAX_ARROW_LENGTH: 110,
  /** Length of a velocity arrow at the maximum slider value, px. */
  BACKGROUND_STAR_COUNT: 70,
  /** Length of a velocity arrow at the maximum slider value, px. */
  STAR_RADIUS: 16,
  WAVES_PATH_LINE_WIDTH: 1.5,
  EARTH_ARROW_HEAD_HEIGHT: 10,
  EARTH_ARROW_HEAD_WIDTH: 14,
  EARTH_ARROW_TAIL_WIDTH: 4,
  EARTH_LABEL_MAX_WIDTH: 120,
  NOTE_LEFT: 8,
  NOTE_TOP: 6,
  ARROW_OPTIONS_HEAD_HEIGHT: 12,
  ARROW_OPTIONS_HEAD_WIDTH: 14,
  ARROW_OPTIONS_TAIL_WIDTH: 4,
  ARROW_OPTIONS_LINE_WIDTH: 0.5,
} as const;

/** Settings for observatory/model/ObservatoryModel.ts. */
export const OBSERVATORY_MODEL_SETTINGS = {
  /** Largest random shift of the time of night, days. */
  TIME_OF_NIGHT_JITTER: 0.2,
  /** Chance that clouds cost a night. */
  CLOUD_PROBABILITY: 0.2,
  /** Precision default (m/s). */
  PRECISION_DEFAULT: 3,
  /** Fit period default (days). */
  FIT_PERIOD_DEFAULT: 10,
  /** Fit amplitude default (m/s). */
  FIT_AMPLITUDE_DEFAULT: 20,
} as const;

/** Settings for observatory/view/ObservatoryChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const OBSERVATORY_CHART_NODE_SETTINGS = {
  ANSWER_PLOT_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_ANSWER_PLOT_LINE_DASH_DASH: 4, // px
  NO_DATA_MAX_WIDTH_OFFSET: 20, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 10, // px
  CONSTRUCTOR_CONTROLS_SPACING: 6, // px
  CONSTRUCTOR_TOP_OFFSET: 6, // px

  /** Smallest time span shown, days. */
  MIN_TIME_SPAN: 10,
  /** Smallest velocity half-range shown, m/s. */
  MIN_HALF_RANGE: 5,
  /** Smallest velocity half-range shown, m/s. */
  POINT_RADIUS: 3,
  /** Smallest velocity half-range shown, m/s. */
  ERROR_CAP: 3,
  /** Model-curve samples per cycle, and the limits on the total. */
  SAMPLES_PER_CYCLE: 40,
  /** Model-curve samples per cycle, and the limits on the total. */
  MIN_SAMPLES: 200,
  /** Model-curve samples per cycle, and the limits on the total. */
  MAX_SAMPLES: 5000,
  /** Zoom factor of one press of a zoom button. */
  BUTTON_ZOOM_FACTOR: 2,
  /** Fraction of the window that one press of a scroll button moves it (the buttons repeat when held). */
  BUTTON_SCROLL_FRACTION: 0.2,
  /** Zoom per pixel of vertical wheel motion: the window scales by exp(deltaY × this). */
  WHEEL_ZOOM_PER_PIXEL: 0.002,
  /** Wheel deltas in lines (Firefox) are converted to pixels with this factor. */
  PIXELS_PER_WHEEL_LINE: 25,
  /** Height of the zoom and scroll buttons. */
  BUTTON_SIZE: 26,
  ANSWER_PLOT_LINE_WIDTH: 2,
  FIT_PLOT_LINE_WIDTH: 2.5,
  POINTS_LINE_WIDTH: 0.5,
  BOTTOM_BOTTOM: -6,
  CONTROLS_SPACING: 4,
} as const;

/** Settings for observatory/view/ObservatoryScreenSummaryContent.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const OBSERVATORY_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  PLAIN_DIGITS: 4, // digits
  PLAIN_DIGITS_SEGMENT_2: 2, // digits

  DEFAULT_DIGITS: 3,
} as const;

/** Settings for observatory/view/ObservatoryScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const OBSERVATORY_SCREEN_VIEW_SETTINGS = {
  STAR_MASS_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  MEASUREMENTS_TEXT_DIGITS: 3, // digits
  RESIDUAL_TEXT_DIGITS: 3, // digits
  RESIDUAL_TEXT_DIGITS_SEGMENT_2: 2, // digits
  PERIOD_FORMAT_SIGNIFICANT_DIGITS: 4, // digits
  AMPLITUDE_FORMAT_SIGNIFICANT_DIGITS: 3, // digits
  EXPLANATION_BUTTON_LABEL_MAX_WIDTH: 150, // px

  CONSTRUCTOR_LEFT_OFFSET: 50, // px
  CONSTRUCTOR_TOP_OFFSET: 22, // px
  TARGET_ITEMS_MAX_WIDTH_OFFSET: 60, // px
  OBSERVING_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_FIT_PANEL_SPACING: 18, // px
  CONSTRUCTOR_RESULT_PANEL_SPACING: 8, // px
  RESULT_PANEL_MIN_WIDTH_OFFSET: 24, // px

  CHART_WIDTH: 610,
  CHART_HEIGHT: 330,
  PRECISION_RADIOS_MAX_WIDTH: 60,
  PRECISION_RADIOS_SPACING: 12,
  PRECISION_RADIOS_RADIUS: 7,
  /** Cadence control significant figures (dimensionless). */
  CADENCE_CONTROL_SIGNIFICANT_FIGURES: 2,
  OBSERVING_PANEL_SPACING: 8,
  /** Period control significant figures (dimensionless). */
  PERIOD_CONTROL_SIGNIFICANT_FIGURES: 5,
  /** Phase control significant figures (dimensionless). */
  PHASE_CONTROL_SIGNIFICANT_FIGURES: 2,
  /** Phase control delta (dimensionless). */
  PHASE_CONTROL_DELTA: 0.01,
  FIT_PANEL_SPACING: 8,
  FIT_PANEL_MAX_WIDTH: 300,
  RESULT_PANEL_SPACING: 7,
} as const;

/** Settings for observatory/view/PeriodogramNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PERIODOGRAM_NODE_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 6, // px
  ANSWER_LINE_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_ANSWER_LINE_LINE_DASH_DASH: 4, // px
  MESSAGE_MAX_WIDTH_OFFSET: 20, // px
  HINT_MAX_WIDTH_OFFSET: 220, // px
  PLACE_CONTROLS_LEFT_OFFSET: 12, // px

  /** A click picks the highest peak within this many pixels of it. */
  CLICK_PICK_PIXELS: 8,
  /** Height of the button below the plot. */
  BUTTON_HEIGHT: 26,
  CONSTRUCTOR_X: -5,
  CONSTRUCTOR_RIGHT: -7,
  RIGHT_RIGHT: -32,
  BOTTOM_BOTTOM: -6,
  CURVE_LINE_WIDTH: 1.5,
  FIT_LINE_LINE_WIDTH: 2,
  ANSWER_LINE_LINE_WIDTH: 2,
} as const;

/** Settings for preferences/StellarWobblePreferencesNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const STELLAR_WOBBLE_PREFERENCES_NODE_SETTINGS = {
  HEADER_FONT_SIZE: 18,
  SHOW_EQUATIONS_CHECKBOX_FONT_SIZE: 14,
  SHOW_EQUATIONS_CHECKBOX_SPACING: 8,
  DESCRIPTION_FONT_SIZE: 12,
  DESCRIPTION_MAX_WIDTH: 420,
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for viewing-angle/model/ViewingAngleModel.ts. */
export const VIEWING_ANGLE_MODEL_SETTINGS = {
  /** Initial inclination, degrees. */
  INITIAL_INCLINATION: 60,
  /** Initial Earth direction, degrees (toward model −y, as on the Wobble screen). */
  INITIAL_EARTH_AZIMUTH: 270,
} as const;

/** Settings for viewing-angle/view/Orbit3DViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ORBIT_3D_VIEW_NODE_SETTINGS = {
  BARYCENTER_X_SEGMENT_2: 5, // px
  BARYCENTER_Y_SEGMENT_2: 5, // px
  BARYCENTER_X_MOVE_TO_Y: 5, // px

  TITLE_MAX_WIDTH_OFFSET: 16, // px
  PLANET_ORBIT_LINE_DASH_DASH: 4, // px
  STAR_ORBIT_LINE_DASH_DASH: 3, // px
  NORMAL_LINE_LINE_DASH_DASH: 4, // px

  /** Drawn planet-orbit radius, px. */
  PLANET_ORBIT_RADIUS: 115,
  /** Largest drawn radius of the star's own orbit, px. */
  MAX_STAR_ORBIT_RADIUS: 30,
  /** Length of the Earth direction arrow, px. */
  EARTH_ARROW_LENGTH: 150,
  /** Length of the star's velocity arrow, px. */
  VELOCITY_ARROW_LENGTH: 60,
  /** Samples used to draw each orbit path. */
  ORBIT_SAMPLES: 90,
  /** Minimum camera elevation above the orbital plane, degrees. */
  ELEVATION_RANGE_MIN: -85,
  /** Maximum camera elevation above the orbital plane, degrees. */
  ELEVATION_RANGE_MAX: 85,
  /** Keyboard camera step, degrees. */
  KEYBOARD_STEP_DEG: 5,
  /** Drag sensitivity, degrees per pixel. */
  DRAG_DEG_PER_PX: 0.5,
  /** Initial camera elevation above the orbital plane, degrees. */
  INITIAL_ELEVATION: 25,
  /** Initial camera azimuth (side-on to Earth at −y), degrees. */
  INITIAL_AZIMUTH: 90,
  TITLE_LEFT: 8,
  TITLE_TOP: 6,
  NOT_TO_SCALE_LEFT: 8,
  NOT_TO_SCALE_TOP: 26,
  /** Plane fill opacity (dimensionless). */
  PLANE_FILL_OPACITY: 0.12,
  BARYCENTER_X: -5,
  BARYCENTER_Y: -5,
  BARYCENTER_LINE_WIDTH: 2,
  PLANET_RADIUS: 6,
  PLANET_LINE_WIDTH: 0.5,
  EARTH_ARROW_HEAD_HEIGHT: 12,
  EARTH_ARROW_HEAD_WIDTH: 14,
  EARTH_ARROW_TAIL_WIDTH: 4,
  EARTH_LABEL_MAX_WIDTH: 90,
  ARROW_OPTIONS_HEAD_HEIGHT: 10,
  ARROW_OPTIONS_HEAD_WIDTH: 12,
  ARROW_OPTIONS_TAIL_WIDTH: 3.5,
  ARROW_OPTIONS_LINE_WIDTH: 0.5,
  LABEL_OFFSET_Y: -18,
} as const;

/** Settings for viewing-angle/view/PhaseRVChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PHASE_RV_CHART_NODE_SETTINGS = {
  GHOST_PLOT_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_GHOST_PLOT_LINE_DASH_DASH: 4, // px
  LEGEND_LINE_DASH_DASH: 6, // px
  CONSTRUCTOR_LEGEND_LINE_DASH_DASH: 4, // px
  CONSTRUCTOR_RIGHT_OFFSET: 4, // px

  SAMPLES: 120,
  HEADROOM: 1.15,
  /** Away tint opacity (dimensionless). */
  AWAY_TINT_OPACITY: 0.08,
  /** Toward tint opacity (dimensionless). */
  TOWARD_TINT_OPACITY: 0.08,
  GHOST_PLOT_LINE_WIDTH: 2,
  CURVE_PLOT_LINE_WIDTH: 2.5,
  /** Cursor opacity (dimensionless). */
  CURSOR_OPACITY: 0.6,
  CURSOR_DOT_RADIUS: 5,
  BOTTOM_BOTTOM: -6,
  LEGEND_SPACING: 5,
  LEGEND_END_X: 22,
  LEGEND_LINE_WIDTH: 2,
  TOP_TOP: 3,
} as const;

/** Settings for viewing-angle/view/SkyViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const SKY_VIEW_NODE_SETTINGS = {
  TITLE_MAX_WIDTH_OFFSET: 12, // px
  PLANET_ORBIT_LINE_DASH_DASH: 3, // px

  ORBIT_SAMPLES: 72,
  TITLE_LEFT: 6,
  TITLE_TOP: 4,
  PLANET_RADIUS: 4,
  /** Planet opacity (dimensionless). */
  PLANET_OPACITY: 0.6,
} as const;

/** Settings for viewing-angle/view/ViewingAngleScreenSummaryContent.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const VIEWING_ANGLE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  PLAIN_DIGITS: 2, // digits

  DEFAULT_DIGITS: 3,
} as const;

/** Settings for viewing-angle/view/ViewingAngleScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const VIEWING_ANGLE_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 10, // px
  CONSTRUCTOR_LEFT_OFFSET: 20, // px
  EXPLANATION_ROW_MAX_WIDTH_OFFSET: 40, // px
  READOUT_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_RIGHT_OFFSET: 30, // px

  VIEW_3_D_WIDTH: 390,
  VIEW_3_D_HEIGHT: 330,
  SKY_VIEW_SIZE: 185,
  CHART_WIDTH: 270,
  CHART_HEIGHT: 200,
  READOUT_WIDTH: 300,
  /** Below this inclination (degrees) the face-on warning is shown. */
  FACE_ON_WARNING_INCLINATION: 3,
  EXPLANATION_ROW_SPACING: 8,
  READOUT_PANEL_SPACING: 6,
  TICK_LABEL_MAX_WIDTH: 60,
  /** Inclination control significant figures (dimensionless). */
  INCLINATION_CONTROL_SIGNIFICANT_FIGURES: 2,
  /** Azimuth control significant figures (dimensionless). */
  AZIMUTH_CONTROL_SIGNIFICANT_FIGURES: 3,
  /** Azimuth control delta (dimensionless). */
  AZIMUTH_CONTROL_DELTA: 5,
  CONTROL_PANEL_SPACING: 14,
} as const;

/** Settings for wobble/view/LiveRVChartNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const LIVE_RV_CHART_NODE_SETTINGS = {
  /** Fraction of the y range left above the curve's peak. */
  HEADROOM: 1.15,
  /** Away tint opacity (dimensionless). */
  AWAY_TINT_OPACITY: 0.08,
  /** Toward tint opacity (dimensionless). */
  TOWARD_TINT_OPACITY: 0.08,
  AWAY_LABEL_LEFT: 4,
  AWAY_LABEL_TOP: 2,
  TOWARD_LABEL_LEFT: 4,
  TRACE_PLOT_LINE_WIDTH: 2.5,
  CURRENT_POINT_RADIUS: 5,
  BOTTOM_BOTTOM: -6,
} as const;

/** Settings for wobble/view/TopViewNode.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const TOP_VIEW_NODE_SETTINGS = {
  CIRCLE_RADIUS: 0.9, // px
  BARYCENTER_X_SEGMENT_2: 6, // px
  BARYCENTER_Y_SEGMENT_2: 6, // px
  BARYCENTER_X_MOVE_TO_Y: 6, // px

  TITLE_MAX_WIDTH_OFFSET: 16, // px
  PLANET_ORBIT_LINE_DASH_DASH: 4, // px
  STAR_ORBIT_LINE_DASH_DASH: 3, // px
  PLANET_SIZE_MULTILINK_RADIUS_OFFSET: 3, // px
  PLANET_SIZE_MULTILINK_RADIUS_FACTOR: 6, // dimensionless
  CONSTRUCTOR_LEFT_OFFSET: 10, // px
  CONSTRUCTOR_CENTER_Y_OFFSET: 24, // px
  MAGNIFICATION_TEXT_MAX_WIDTH_OFFSET: 16, // px
  CAPTION_LINE_WRAP_OFFSET: 40, // px
  CONSTRUCTOR_BOTTOM_OFFSET: 48, // px
  UPDATE_MULTILINK_BOTTOM_OFFSET: 8, // px
  UPDATE_MULTILINK_TOP_OFFSET: 8, // px
  LINE_OF_SIGHT_LINE_DASH_DASH: 5, // px

  /** Drawn planet-orbit radius at the smallest and largest distance, px. */
  MIN_ORBIT_RADIUS: 55,
  /** Drawn planet-orbit radius at the smallest and largest distance, px. */
  MAX_ORBIT_RADIUS: 140,
  /** Largest drawn radius of the star's own orbit, px. */
  MAX_STAR_ORBIT_RADIUS: 42,
  /** Length of the star's velocity arrow, px. */
  VELOCITY_ARROW_LENGTH: 55,
  /** Length of the star's velocity arrow, px. */
  BACKGROUND_STAR_COUNT: 45,
  TITLE_LEFT: 8,
  TITLE_TOP: 6,
  BARYCENTER_X: -6,
  BARYCENTER_Y: -6,
  BARYCENTER_LINE_WIDTH: 2.5,
  BARYCENTER_LABEL_MAX_WIDTH: 100,
  PLANET_RADIUS: 5,
  PLANET_LINE_WIDTH: 0.5,
  ARROW_OPTIONS_HEAD_HEIGHT: 10,
  ARROW_OPTIONS_HEAD_WIDTH: 12,
  ARROW_OPTIONS_TAIL_WIDTH: 3.5,
  ARROW_OPTIONS_LINE_WIDTH: 0.5,
  EARTH_ARROW_HEAD_HEIGHT: 10,
  EARTH_ARROW_HEAD_WIDTH: 14,
  EARTH_ARROW_TAIL_WIDTH: 4,
  EARTH_LABEL_MAX_WIDTH: 100,
  NOT_TO_SCALE_LEFT: 8,
  NOT_TO_SCALE_TOP: 26,
  MAGNIFICATION_TEXT_LEFT: 8,
  MAGNIFICATION_TEXT_TOP: 41,
  CAPTION_FONT_SIZE: 13,
} as const;

/** Settings for wobble/view/WobbleScreenSummaryContent.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const WOBBLE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  PLAIN_DIGITS: 2, // digits

  DEFAULT_DIGITS: 3,
} as const;

/** Settings for wobble/view/WobbleScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const WOBBLE_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 10, // px
  CONSTRUCTOR_LEFT_OFFSET: 20, // px
  EXPLANATION_ROW_MAX_WIDTH_OFFSET: 40, // px
  READOUT_PANEL_MIN_WIDTH_OFFSET: 70, // px
  CONTROL_PANEL_MIN_WIDTH_OFFSET: 24, // px
  CONSTRUCTOR_RIGHT_OFFSET: 30, // px

  TOP_VIEW_SIZE: 340,
  CHART_WIDTH: 260,
  CHART_HEIGHT: 250,
  ZOOM_WIDTH: 290,
  EXPLANATION_ROW_SPACING: 8,
  READOUT_PANEL_SPACING: 6,
  /** Star mass control significant figures (dimensionless). */
  STAR_MASS_CONTROL_SIGNIFICANT_FIGURES: 2,
  /** Star mass control delta (dimensionless). */
  STAR_MASS_CONTROL_DELTA: 0.05,
  CONTROL_PANEL_SPACING: 12,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const STAR_NODE_SETTINGS = {
  DISC_LINE_WIDTH_FACTOR: 0.08, // dimensionless
} as const;

/** Numerical settings; units are specified per value. */
export const ORBIT_SOLVER = {
  /** Maximum minimum-mass fixed-point iterations (count). */
  MASS_ITERATIONS: 30,
  /** Relative convergence tolerance on inferred planet mass. */
  MASS_RELATIVE_TOLERANCE: 1e-12,
} as const;

/** Numerical settings; units are specified per value. */
export const PERIODOGRAM_NUMERICS = {
  /** Relative degeneracy threshold for the two-component sinusoid fit. */
  MIN_RELATIVE_DETERMINANT: 1e-12,
  /** Maximum frequency grid size (count). */
  MAX_FREQUENCIES: 40_000,
  /** Frequency samples per independent baseline interval. */
  OVERSAMPLING: 5,
  /** Golden-section iterations refining a periodogram peak (count). */
  PEAK_ITERATIONS: 40,
} as const;

/** Numerical settings; units are specified per value. */
export const SPECTRUM_NUMERICS = {
  /** Absorption line cutoff in standard deviations. */
  LINE_SIGMA_CUTOFF: 6,
} as const;

/** Numerical settings; units are specified per value. */
export const MYSTERY_TARGET_SETTINGS = {
  /** Maximum random draws to find a suitable mystery system (count). */
  MAX_DRAW_ATTEMPTS: 1000,
} as const;

/** Numerical settings; units are specified per value. */
export const ORBITAL_SYSTEM_DEFAULTS = {
  /** Default edge-on orbital inclination (degrees). */
  INCLINATION_DEGREES: 90,
  /** Default direction toward Earth in the orbital plane (degrees). */
  EARTH_AZIMUTH_DEGREES: 270,
  /** Subdivisions of a trace sample interval for history updates. */
  TRACE_OVERSAMPLING: 4,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const DOPPLER_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  SPEAK_VELOCITY_DIGITS: 3, // digits
  FORMAT_SIGNIFICANT_DIGITS: 2, // digits
} as const;

StellarWobbleNamespace.register("StellarWobbleConstants", {
  G_SI,
  SPEED_OF_LIGHT,
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
});
