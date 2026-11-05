/**
 * ObservatoryScreenSummaryContent.ts
 *
 * The accessible screen summary for the Observatory screen. Its current-details
 * paragraph stays live: the number of measurements, the user's model, and the
 * scatter of the data about it.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ObservatoryModel } from "../model/ObservatoryModel.js";

export class ObservatoryScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ObservatoryModel) {
    const a11y = StringManager.getInstance().getObservatoryA11yStrings();
    const plain = (value: number, digits = 3) =>
      Number.isFinite(value) ? toPlainText(formatSignificant(value, digits)) : "-";

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        count: model.measurementCountProperty,
        period: new DerivedProperty([model.fitPeriodProperty], (period) => plain(period, 4)),
        amplitude: new DerivedProperty([model.fitAmplitudeProperty], (amplitude) => plain(amplitude)),
        residual: new DerivedProperty([model.residualProperty], (residual) =>
          residual === null ? "-" : plain(residual),
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
