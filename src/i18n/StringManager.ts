/**
 * StringManager.ts
 *
 * Centralizes all localized string access for the simulation.
 *
 * Strings are loaded from JSON files per locale and wrapped in reactive
 * Property objects by SceneryStack. When the user switches language in the
 * Preferences dialog, all StringProperties update automatically.
 *
 * ── How to add a locale ───────────────────────────────────────────────────────
 * 1. Create src/i18n/strings_XX.json with the same keys as strings_en.json
 * 2. Import it below and add `XX: stringsXX` to the locale map
 * 3. Add "XX" to `availableLocales` in src/init.ts
 *
 * ── How to add a string ───────────────────────────────────────────────────────
 * 1. Add the key + English value to strings_en.json
 * 2. Add the same key + translated value to ALL other locale files
 *    (TypeScript will show an error here if any locale is missing a key)
 * 3. Read it through the matching getter below
 */

import type { ReadOnlyProperty } from "scenerystack/axon";
import { LocalizedString } from "scenerystack/chipper";
import stringsEn from "./strings_en.json";
import stringsEs from "./strings_es.json";
import stringsFr from "./strings_fr.json";

// ── Compile-time key-parity check ─────────────────────────────────────────────
// English is the canonical shape; every other locale must match it exactly.
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsFr satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsFr);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEs satisfies typeof stringsEn);
// biome-ignore lint/complexity/noVoid: intentional compile-time type assertion
void (stringsEn satisfies typeof stringsEs);

// ── Build the reactive string property tree ───────────────────────────────────
const stringProperties = LocalizedString.getNestedStringProperties({
  en: stringsEn,
  fr: stringsFr,
  es: stringsEs,
});

/**
 * StringManager is a singleton that provides typed access to all localized
 * strings. Use `StringManager.getInstance()` everywhere — never construct it
 * directly.
 */
export class StringManager {
  private static instance: StringManager | null = null;

  private constructor() {
    // Private — obtain via getInstance()
  }

  public static getInstance(): StringManager {
    if (StringManager.instance === null) {
      StringManager.instance = new StringManager();
    }
    return StringManager.instance;
  }

  /** The simulation title shown in the navigation bar and browser tab. */
  public getTitleStringProperty(): ReadOnlyProperty<string> {
    return stringProperties.titleStringProperty;
  }

  /** Screen name StringProperties used when constructing Screen instances. */
  public getScreenNames(): {
    readonly dopplerStringProperty: ReadOnlyProperty<string>;
    readonly wobbleStringProperty: ReadOnlyProperty<string>;
    readonly viewingAngleStringProperty: ReadOnlyProperty<string>;
    readonly observatoryStringProperty: ReadOnlyProperty<string>;
  } {
    return {
      dopplerStringProperty: stringProperties.screens.dopplerStringProperty,
      wobbleStringProperty: stringProperties.screens.wobbleStringProperty,
      viewingAngleStringProperty: stringProperties.screens.viewingAngleStringProperty,
      observatoryStringProperty: stringProperties.screens.observatoryStringProperty,
    };
  }

  /** Unit symbols and the "value units" pattern. */
  public getUnits() {
    return stringProperties.units;
  }

  /** Labels shared by several screens (spectra, charts, orbit parameters). */
  public getCommonStrings() {
    return stringProperties.common;
  }

  public getDopplerStrings() {
    return stringProperties.doppler;
  }

  public getWobbleStrings() {
    return stringProperties.wobble;
  }

  public getViewingAngleStrings() {
    return stringProperties.viewingAngle;
  }

  public getObservatoryStrings() {
    return stringProperties.observatory;
  }

  /** Accessibility strings for the Doppler screen. */
  public getDopplerA11yStrings() {
    return stringProperties.a11y.doppler;
  }

  /** Accessibility strings for the Wobble screen. */
  public getWobbleA11yStrings() {
    return stringProperties.a11y.wobble;
  }

  /** Accessibility strings for the Viewing Angle screen. */
  public getViewingAngleA11yStrings() {
    return stringProperties.a11y.viewingAngle;
  }

  /** Accessibility strings for the Observatory screen. */
  public getObservatoryA11yStrings() {
    return stringProperties.a11y.observatory;
  }

  /** Simulation-specific preference labels shown in Preferences → Simulation. */
  public getPreferences() {
    return stringProperties.preferences;
  }
}
