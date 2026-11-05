/**
 * DopplerScreenSummaryContent.ts
 *
 * The accessible screen summary for the Doppler screen. Its current-details
 * paragraph stays live: it reports the radial and sideways velocity, the
 * direction of the shift, and Hα's shift in nanometres.
 */
import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { dopplerShift, H_ALPHA } from "../../common/model/stellarSpectrum.js";
import { formatSignificant, toPlainText } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { DopplerModel } from "../model/DopplerModel.js";

/** Plain-text speech of a velocity in m/s with units ("100 kilometers per second" is read from "100 km/s"). */
function speakVelocity(velocity: number, planetSpeeds: boolean, kms: string, ms: string): string {
  const value = planetSpeeds ? velocity : velocity / 1000;
  return `${toPlainText(formatSignificant(value, 3))} ${planetSpeeds ? ms : kms}`;
}

export class DopplerScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: DopplerModel) {
    const stringManager = StringManager.getInstance();
    const a11y = stringManager.getDopplerA11yStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();

    const shiftProperty = new DerivedProperty(
      [
        model.radialVelocityProperty,
        common.redshiftStringProperty,
        common.blueshiftStringProperty,
        common.noShiftStringProperty,
      ],
      (velocity, redshift, blueshift, noShift) => {
        const text = velocity > 0 ? redshift : velocity < 0 ? blueshift : noShift;
        return `${text}.`;
      },
    );
    const velocityProperty = (property: typeof model.radialVelocityProperty) =>
      new DerivedProperty(
        [
          property,
          model.planetSpeedsProperty,
          units.kilometersPerSecondStringProperty,
          units.metersPerSecondStringProperty,
        ],
        speakVelocity,
      );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: new PatternStringProperty(a11y.currentDetailsPatternStringProperty, {
        radial: velocityProperty(model.radialVelocityProperty),
        sideways: velocityProperty(model.sidewaysVelocityProperty),
        shift: shiftProperty,
        delta: new DerivedProperty([model.radialVelocityProperty], (velocity) =>
          toPlainText(formatSignificant(dopplerShift(H_ALPHA.restWavelength, velocity), 2)),
        ),
      }),
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
