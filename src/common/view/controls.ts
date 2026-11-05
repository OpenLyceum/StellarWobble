/**
 * controls.ts
 *
 * Factories for the themed controls every screen uses:
 *  - {@link createNumberControl}: a NumberControl with a units suffix, a
 *    significant-figure readout, and an optional logarithmic slider (masses and
 *    distances span several decades). Adapted from ExtrasolarPlanets.
 *  - {@link createCheckbox}: a themed checkbox with a text label.
 *  - {@link createExplanationButton}: an info button opening a dialog of short
 *    explanatory paragraphs.
 *  - {@link createEquationNode}: rich text shown only when the "Show equations"
 *    preference is on.
 */

import { NumberProperty, type PhetioProperty, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { combineOptions } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { type Node, RichText, Text, VBox } from "scenerystack/scenery";
import { InfoButton, NumberControl, type NumberControlOptions, PhetFont } from "scenerystack/scenery-phet";
import { Dialog } from "scenerystack/sim";
import { Checkbox, type CheckboxOptions } from "scenerystack/sun";
import { StringManager } from "../../i18n/StringManager.js";
import { stellarWobblePreferences } from "../../preferences/StellarWobblePreferencesModel.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS } from "../../StellarWobbleConstants.js";
import {
  STELLAR_WOBBLE_CHECKBOX_OPTIONS,
  STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS,
} from "../StellarWobbleControlOptions.js";
import { formatSignificant } from "./chartUtils.js";

export type CreateNumberControlOptions = {
  /** Localized unit symbol appended after the value (rich text, e.g. M<sub>J</sub>). */
  unitsProperty?: TReadOnlyProperty<string>;
  /** Significant figures of the readout (default 3). */
  significantFigures?: number;
  /** Arrow-button step; in decades on a logarithmic control (default 1/100 of the range, or 0.02 decade). */
  delta?: number;
  /** Move the slider on a log₁₀ scale. */
  logarithmic?: boolean;
  /** Accessible name; defaults to the visible title. */
  accessibleName?: TReadOnlyProperty<string>;
  /** Write the units straight after the value, with no pattern (for "°"). */
  compactUnits?: boolean;
  /** Extra NumberControl options merged last. */
  numberControlOptions?: NumberControlOptions;
};

const DIALOG_TITLE_FONT = new PhetFont({ size: 20, weight: "bold" });

/** Rounds a value to `significantFigures`. */
const roundToFigures = (value: number, significantFigures: number): number =>
  value === 0 ? 0 : Number(value.toPrecision(significantFigures));

/**
 * A log₁₀ proxy of `property` for a logarithmic slider, kept in step both ways.
 * A value the proxy sets is rounded to the readout's figures and kept in range.
 */
function createLogarithmicProxy(property: PhetioProperty<number>, range: Range, figures: number): NumberProperty {
  const proxy = new NumberProperty(Math.log10(property.value), {
    range: new Range(Math.log10(range.min), Math.log10(range.max)),
  });
  let updating = false;
  proxy.lazyLink((log) => {
    if (!updating) {
      updating = true;
      property.value = range.constrainValue(roundToFigures(10 ** log, figures));
      updating = false;
    }
  });
  property.lazyLink((value) => {
    if (!updating) {
      updating = true;
      proxy.value = proxy.range.constrainValue(Math.log10(value));
      updating = false;
    }
  });
  return proxy;
}

export function createNumberControl(
  titleProperty: TReadOnlyProperty<string>,
  numberProperty: PhetioProperty<number>,
  range: Range,
  options: CreateNumberControlOptions = {},
): NumberControl {
  const figures = options.significantFigures ?? 3;
  const logarithmic = options.logarithmic ?? false;
  const units = StringManager.getInstance().getUnits();

  const controlledProperty = logarithmic ? createLogarithmicProxy(numberProperty, range, figures) : numberProperty;
  const controlledRange = logarithmic ? new Range(Math.log10(range.min), Math.log10(range.max)) : range;
  const delta = options.delta ?? (logarithmic ? 0.02 : (range.max - range.min) / 100);
  const toValue = (controlled: number): number => (logarithmic ? range.constrainValue(10 ** controlled) : controlled);

  const unitsProperty = options.unitsProperty;
  const format = (controlled: number): string => {
    const text = formatSignificant(roundToFigures(toValue(controlled), figures), figures);
    if (!unitsProperty) {
      return text;
    }
    return options.compactUnits
      ? `${text}${unitsProperty.value}`
      : StringUtils.fillIn(units.valueUnitsPatternStringProperty.value, { value: text, units: unitsProperty.value });
  };

  return new NumberControl(
    titleProperty,
    controlledProperty,
    controlledRange,
    combineOptions<NumberControlOptions>(
      {},
      STELLAR_WOBBLE_NUMBER_CONTROL_OPTIONS,
      {
        delta,
        accessibleName: options.accessibleName ?? titleProperty,
        titleNodeOptions: { fill: StellarWobbleColors.textColorProperty, font: FONTS.LABEL, maxWidth: 130 },
        numberDisplayOptions: {
          useRichText: true,
          textOptions: { fill: StellarWobbleColors.controlSurfaceTextColorProperty, font: FONTS.LABEL },
          backgroundFill: StellarWobbleColors.controlSurfaceColorProperty,
          numberFormatter: format,
          numberFormatterDependencies: unitsProperty
            ? [unitsProperty, units.valueUnitsPatternStringProperty]
            : [units.valueUnitsPatternStringProperty],
          maxWidth: 110,
        },
      },
      options.numberControlOptions,
    ),
  );
}

/** A themed checkbox with a text label. */
export function createCheckbox(
  property: Property<boolean>,
  labelProperty: TReadOnlyProperty<string>,
  options?: CheckboxOptions,
): Checkbox {
  return new Checkbox(
    property,
    new Text(labelProperty, { font: FONTS.LABEL, fill: StellarWobbleColors.textColorProperty, maxWidth: 180 }),
    combineOptions<CheckboxOptions>({ accessibleName: labelProperty }, STELLAR_WOBBLE_CHECKBOX_OPTIONS, options),
  );
}

/**
 * An info button that opens a dialog with a title and short paragraphs (rich
 * text, so equations can use sub- and superscripts).
 */
export function createExplanationButton(
  titleProperty: TReadOnlyProperty<string>,
  paragraphProperties: readonly TReadOnlyProperty<string>[],
  accessibleNameProperty: TReadOnlyProperty<string>,
): InfoButton {
  let dialog: Dialog | null = null;
  const textFill = StellarWobbleColors.controlSurfaceTextColorProperty;
  return new InfoButton({
    iconFill: StellarWobbleColors.accentColorProperty,
    scale: 0.6,
    accessibleName: accessibleNameProperty,
    listener: () => {
      if (!dialog) {
        const paragraphs = paragraphProperties.map(
          (paragraph) =>
            new RichText(paragraph, { font: FONTS.EXPLANATION, fill: textFill, lineWrap: 600, leading: 3 }),
        );
        dialog = new Dialog(new VBox({ align: "left", spacing: 14, children: paragraphs }), {
          title: new Text(titleProperty, { font: DIALOG_TITLE_FONT, fill: textFill, maxWidth: 600 }),
          fill: StellarWobbleColors.controlSurfaceColorProperty,
        });
      }
      dialog.show();
    },
  });
}

/** Rich text visible only while the "Show equations" preference is on. */
export function createEquationNode(equationProperty: TReadOnlyProperty<string>, maxWidth = 220): Node {
  return new RichText(equationProperty, {
    font: FONTS.READOUT,
    fill: StellarWobbleColors.accentColorProperty,
    maxWidth: maxWidth,
    visibleProperty: stellarWobblePreferences.showEquationsProperty,
  });
}
