/**
 * ViewingAngleScreenSummaryContent.ts
 *
 * The accessible screen summary for the Viewing Angle screen. Its
 * current-details paragraph stays live: the tilt, the measured and edge-on
 * amplitudes, and the minimum mass against the true mass.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { formatPlanetMass, unitsDependencies } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ViewingAngleModel } from "../model/ViewingAngleModel.js";

export class ViewingAngleScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ViewingAngleModel) {
    const a11y = StringManager.getInstance().getViewingAngleA11yStrings();
    const system = model.system;
    const plain = (value: number, digits = 3) => toPlainText(formatSignificant(value, digits));

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        inclination: new DerivedProperty([system.inclinationProperty], (inclination) => plain(inclination, 2)),
        measured: new DerivedProperty([system.semiAmplitudeProperty], (amplitude) => plain(amplitude)),
        edgeOn: new DerivedProperty([system.edgeOnAmplitudeProperty], (amplitude) => plain(amplitude)),
        minimum: new DerivedProperty([model.minimumMassProperty], (mass) => plain(mass)),
        trueMass: DerivedProperty.deriveAny([system.planetMassProperty, ...unitsDependencies()], () =>
          toPlainText(formatPlanetMass(system.planetMassProperty.value)),
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
