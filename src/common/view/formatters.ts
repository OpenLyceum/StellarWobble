/**
 * formatters.ts
 *
 * Readout formatting with localized units: periods in days or years, speeds in
 * m/s or km/s, planet masses in Jupiter or Earth masses. Each returns rich text
 * built from the "{{value}} {{units}}" pattern so a locale can reorder them.
 */

import { StringUtils } from "scenerystack/phetcommon";
import { StringManager } from "../../i18n/StringManager.js";
import {
  DAY_S,
  DAYS_PER_YEAR,
  EARTH_MASS_KG,
  FORMATTERS_SETTINGS,
  JUPITER_MASS_KG,
} from "../../StellarWobbleConstants.js";
import { formatSignificant } from "./chartUtils.js";

function valueWithUnits(value: string, units: string): string {
  return StringUtils.fillIn(StringManager.getInstance().getUnits().valueUnitsPatternStringProperty.value, {
    value: value,
    units: units,
  });
}

/** A period (s) in days below two years, otherwise in years. */
export function formatPeriod(periodS: number): string {
  const units = StringManager.getInstance().getUnits();
  const days = periodS / DAY_S;
  return days < 2 * DAYS_PER_YEAR
    ? valueWithUnits(formatSignificant(days, FORMATTERS_SETTINGS.FORMAT_PERIOD_DIGITS), units.daysStringProperty.value)
    : valueWithUnits(
        formatSignificant(days / DAYS_PER_YEAR, FORMATTERS_SETTINGS.FORMAT_PERIOD_DIGITS),
        units.yearsStringProperty.value,
      );
}

/** A speed (m/s) in m/s below 1 km/s, otherwise in km/s. */
export function formatSpeed(speed: number, digits: number = FORMATTERS_SETTINGS.DEFAULT_DIGITS): string {
  const units = StringManager.getInstance().getUnits();
  return Math.abs(speed) < 1000
    ? valueWithUnits(formatSignificant(speed, digits), units.metersPerSecondStringProperty.value)
    : valueWithUnits(formatSignificant(speed / 1000, digits), units.kilometersPerSecondStringProperty.value);
}

/** A planet mass (Jupiter masses) in Jupiter masses, or Earth masses below 0.1 M_J. */
export function formatPlanetMass(massJupiter: number): string {
  const units = StringManager.getInstance().getUnits();
  return massJupiter < 0.1
    ? valueWithUnits(
        formatSignificant(
          (massJupiter * JUPITER_MASS_KG) / EARTH_MASS_KG,
          FORMATTERS_SETTINGS.FORMAT_PLANET_MASS_DIGITS,
        ),
        units.earthMassesStringProperty.value,
      )
    : valueWithUnits(
        formatSignificant(massJupiter, FORMATTERS_SETTINGS.FORMAT_PLANET_MASS_DIGITS),
        units.jupiterMassesStringProperty.value,
      );
}

/** The smallest of 1, 2 or 5 × 10ⁿ that is at least `value` (for chart ranges). */
export function niceCeil(value: number): number {
  if (!(value > 0 && Number.isFinite(value))) {
    return 1;
  }
  const decade = 10 ** Math.floor(Math.log10(value));
  const mantissa = value / decade;
  return decade * (mantissa <= 1 ? 1 : mantissa <= 2 ? 2 : mantissa <= 5 ? 5 : 10);
}

/**
 * Every units string, so a readout DerivedProperty that calls these formatters
 * can list them as dependencies and update when the locale changes.
 */
export function unitsDependencies() {
  const units = StringManager.getInstance().getUnits();
  return [
    units.valueUnitsPatternStringProperty,
    units.daysStringProperty,
    units.yearsStringProperty,
    units.metersPerSecondStringProperty,
    units.kilometersPerSecondStringProperty,
    units.jupiterMassesStringProperty,
    units.earthMassesStringProperty,
  ] as const;
}
