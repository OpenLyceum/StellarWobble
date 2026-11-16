/**
 * WobbleScreenSummaryContent.ts
 *
 * The accessible screen summary for the Wobble screen. Its current-details
 * paragraph stays live: planet mass, distance, star mass, period, and the size
 * of the star's radial-velocity swing.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { formatPeriod, unitsDependencies } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import { WOBBLE_SCREEN_SUMMARY_CONTENT_SETTINGS } from "../../StellarWobbleConstants.js";
import type { WobbleModel } from "../model/WobbleModel.js";

export class WobbleScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: WobbleModel) {
    const a11y = StringManager.getInstance().getWobbleA11yStrings();
    const system = model.system;
    const plain = (value: number, digits: number = WOBBLE_SCREEN_SUMMARY_CONTENT_SETTINGS.DEFAULT_DIGITS) =>
      toPlainText(formatSignificant(value, digits));

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        planetMass: new DerivedProperty([system.planetMassProperty], (mass) => plain(mass)),
        distance: new DerivedProperty([system.distanceProperty], (distance) => plain(distance)),
        starMass: new DerivedProperty([system.starMassProperty], (mass) =>
          plain(mass, WOBBLE_SCREEN_SUMMARY_CONTENT_SETTINGS.PLAIN_DIGITS),
        ),
        period: DerivedProperty.deriveAny([system.periodProperty, ...unitsDependencies()], () =>
          toPlainText(formatPeriod(system.periodProperty.value)),
        ),
        amplitude: new DerivedProperty([system.semiAmplitudeProperty], (amplitude) => plain(amplitude)),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
