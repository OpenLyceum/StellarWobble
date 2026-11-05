/**
 * DopplerScreenView.ts
 *
 * The Doppler screen: how a star's speed along our line of sight is measured
 * from the shift of its spectral lines.
 *
 *  - Top left: the wave picture (WaveViewNode), a star sending light toward
 *    Earth, with velocity arrows.
 *  - Bottom left: the star's full visible spectrum under the laboratory one,
 *    and zoom windows on Hβ and Hα that show the shift.
 *  - Right: velocity sliders, display checkboxes, readouts, and the
 *    explanation button.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { dopplerShift, H_ALPHA, H_BETA } from "../../common/model/stellarSpectrum.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
} from "../../common/StellarWobbleButtonOptions.js";
import { StellarWobblePanel } from "../../common/StellarWobblePanel.js";
import { formatGrouped, formatSigned } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
} from "../../common/view/controls.js";
import { FullSpectrumNode } from "../../common/view/FullSpectrumNode.js";
import { SpectralLineZoomNode } from "../../common/view/SpectralLineZoomNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  CONTROL_PANEL_WIDTH,
  FONTS,
  SCREEN_VIEW_MARGIN,
  STAR_SPEED_RANGE_KMS,
  WOBBLE_SPEED_RANGE_MS,
} from "../../StellarWobbleConstants.js";
import type { DopplerModel } from "../model/DopplerModel.js";
import { DopplerScreenSummaryContent } from "./DopplerScreenSummaryContent.js";
import { WaveViewNode } from "./WaveViewNode.js";

export type DopplerScreenViewOptions = ScreenViewOptions;

const WAVE_VIEW_WIDTH = 560;
const WAVE_VIEW_HEIGHT = 250;
const ZOOM_WIDTH = 230;
const FRAME_DT = 1 / 30;

export class DopplerScreenView extends ScreenView {
  private readonly waveView: WaveViewNode;

  public constructor(model: DopplerModel, providedOptions?: DopplerScreenViewOptions) {
    const options = optionize<DopplerScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new DopplerScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getDopplerStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getDopplerA11yStrings();
    const bounds = this.layoutBounds;

    // ── Wave picture ──────────────────────────────────────────────────────────
    this.waveView = new WaveViewNode(model, WAVE_VIEW_WIDTH, WAVE_VIEW_HEIGHT);
    this.waveView.left = bounds.minX + SCREEN_VIEW_MARGIN;
    this.waveView.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── Spectra ───────────────────────────────────────────────────────────────
    const fullSpectrum = new FullSpectrumNode(model.radialVelocityProperty, WAVE_VIEW_WIDTH - 36);
    fullSpectrum.left = this.waveView.left;
    fullSpectrum.top = this.waveView.bottom + 10;

    const zoomBeta = new SpectralLineZoomNode(H_BETA, model.radialVelocityProperty, model.magnificationProperty, {
      width: ZOOM_WIDTH,
    });
    const zoomAlpha = new SpectralLineZoomNode(H_ALPHA, model.radialVelocityProperty, model.magnificationProperty, {
      width: ZOOM_WIDTH,
    });
    const zooms = new HBox({ spacing: 24, align: "top", children: [zoomBeta, zoomAlpha] });
    zooms.left = this.waveView.left;
    zooms.top = fullSpectrum.bottom + 8;

    // ── Controls ──────────────────────────────────────────────────────────────
    const kmsControlOptions = { unitsProperty: units.kilometersPerSecondStringProperty, delta: 10 };
    const msControlOptions = { unitsProperty: units.metersPerSecondStringProperty, delta: 1 };
    const radialKms = createNumberControl(
      strings.radialVelocityStringProperty,
      model.radialVelocityKmsProperty,
      STAR_SPEED_RANGE_KMS,
      { ...kmsControlOptions, accessibleName: a11y.controls.radialVelocityStringProperty },
    );
    const sidewaysKms = createNumberControl(
      strings.sidewaysVelocityStringProperty,
      model.sidewaysVelocityKmsProperty,
      STAR_SPEED_RANGE_KMS,
      { ...kmsControlOptions, accessibleName: a11y.controls.sidewaysVelocityStringProperty },
    );
    const radialMs = createNumberControl(
      strings.radialVelocityStringProperty,
      model.radialVelocityMsProperty,
      WOBBLE_SPEED_RANGE_MS,
      { ...msControlOptions, accessibleName: a11y.controls.radialVelocityStringProperty },
    );
    const sidewaysMs = createNumberControl(
      strings.sidewaysVelocityStringProperty,
      model.sidewaysVelocityMsProperty,
      WOBBLE_SPEED_RANGE_MS,
      { ...msControlOptions, accessibleName: a11y.controls.sidewaysVelocityStringProperty },
    );
    const kmsVisibleProperty = DerivedProperty.not(model.planetSpeedsProperty);
    const kmsControls = new VBox({
      spacing: 8,
      children: [radialKms, sidewaysKms],
      visibleProperty: kmsVisibleProperty,
    });
    const msControls = new VBox({
      spacing: 8,
      children: [radialMs, sidewaysMs],
      visibleProperty: model.planetSpeedsProperty,
    });
    const hint = new Text(strings.radialVelocityHintStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH,
    });

    const planetSpeedsCheckbox = createCheckbox(model.planetSpeedsProperty, strings.planetSpeedsStringProperty);
    const wavesCheckbox = createCheckbox(this.waveView.showWavesProperty, strings.showWavesStringProperty);
    const componentsCheckbox = createCheckbox(
      this.waveView.showComponentsProperty,
      strings.showComponentsStringProperty,
    );

    const controlPanel = new StellarWobblePanel(
      new VBox({
        spacing: 10,
        align: "left",
        children: [
          new Node({ children: [kmsControls, msControls] }),
          hint,
          planetSpeedsCheckbox,
          wavesCheckbox,
          componentsCheckbox,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );

    // ── Readouts ──────────────────────────────────────────────────────────────
    const velocityText = (velocityProperty: TReadOnlyProperty<number>): TReadOnlyProperty<string> =>
      new DerivedProperty(
        [
          velocityProperty,
          model.planetSpeedsProperty,
          units.valueUnitsPatternStringProperty,
          units.kilometersPerSecondStringProperty,
          units.metersPerSecondStringProperty,
        ],
        (velocity, planetSpeeds, pattern, kms, ms) =>
          pattern
            .replace("{{value}}", formatSigned(planetSpeeds ? velocity : velocity / 1000, 3))
            .replace("{{units}}", planetSpeeds ? ms : kms),
      );
    const radialReadout = new RichText(
      new PatternStringProperty(strings.radialReadoutPatternStringProperty, {
        value: velocityText(model.radialVelocityProperty),
      }),
      { font: FONTS.READOUT, fill: StellarWobbleColors.textColorProperty, maxWidth: CONTROL_PANEL_WIDTH },
    );
    const sidewaysReadout = new RichText(
      new PatternStringProperty(strings.sidewaysReadoutPatternStringProperty, {
        value: velocityText(model.sidewaysVelocityProperty),
      }),
      { font: FONTS.READOUT, fill: StellarWobbleColors.textColorProperty, maxWidth: CONTROL_PANEL_WIDTH },
    );
    const shiftDescriptionProperty = new DerivedProperty(
      [
        model.radialVelocityProperty,
        common.redshiftStringProperty,
        common.blueshiftStringProperty,
        common.noShiftStringProperty,
      ],
      (velocity, redshift, blueshift, noShift) => {
        if (velocity > 0) {
          return redshift;
        }
        return velocity < 0 ? blueshift : noShift;
      },
    );
    const shiftDescription = new Text(shiftDescriptionProperty, {
      font: FONTS.TITLE,
      maxWidth: CONTROL_PANEL_WIDTH,
    });
    model.radialVelocityProperty.link((velocity) => {
      shiftDescription.fill =
        velocity > 0
          ? StellarWobbleColors.redshiftColorProperty
          : velocity < 0
            ? StellarWobbleColors.blueshiftColorProperty
            : StellarWobbleColors.transverseColorProperty;
    });

    const equation = createEquationNode(strings.equationStringProperty, CONTROL_PANEL_WIDTH);
    const equationValues = new RichText(
      new PatternStringProperty(strings.equationValuesPatternStringProperty, {
        shift: new DerivedProperty([model.radialVelocityProperty], (velocity) =>
          formatSigned(dopplerShift(H_ALPHA.restWavelength, velocity), 2),
        ),
        rest: String(H_ALPHA.restWavelength),
        velocity: new DerivedProperty([model.radialVelocityProperty], (velocity) =>
          formatGrouped(velocity).replace("-", "−"),
        ),
      }),
      {
        font: FONTS.READOUT,
        fill: StellarWobbleColors.accentColorProperty,
        maxWidth: CONTROL_PANEL_WIDTH,
        visibleProperty: equation.visibleProperty,
      },
    );

    const explanationButton = createExplanationButton(
      strings.explanationTitleStringProperty,
      [
        strings.explanation1StringProperty,
        strings.explanation2StringProperty,
        strings.explanation3StringProperty,
        strings.explanation4StringProperty,
      ],
      a11y.controls.explanationStringProperty,
    );
    const explanationLabel = new Text(common.explanationButtonStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: CONTROL_PANEL_WIDTH - 40,
    });

    const readoutPanel = new StellarWobblePanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          shiftDescription,
          radialReadout,
          sidewaysReadout,
          equation,
          equationValues,
          new HBox({ spacing: 8, children: [explanationButton, explanationLabel] }),
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );

    const rightColumn = new VBox({ spacing: 10, align: "left", children: [controlPanel, readoutPanel] });
    rightColumn.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    rightColumn.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── Time controls and Reset All ──────────────────────────────────────────
    const timeControlNode = new TimeControlNode(model.timer.isPlayingProperty, {
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => this.waveView.advance(FRAME_DT * 3),
        },
      },
    });
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });
    timeControlNode.right = resetAllButton.left - 30;
    timeControlNode.bottom = resetAllButton.bottom;

    this.children = [this.waveView, fullSpectrum, zooms, rightColumn, timeControlNode, resetAllButton];

    // ── Accessibility: traversal order ─────────────────────────────────────────
    this.addChild(
      new Node({
        pdomOrder: [
          kmsControls,
          msControls,
          planetSpeedsCheckbox,
          wavesCheckbox,
          componentsCheckbox,
          explanationButton,
          timeControlNode,
          resetAllButton,
        ],
      }),
    );
  }

  /** Resets view-side state (wave picture and its checkboxes). */
  public reset(): void {
    this.waveView.reset();
  }

  public override step(dt: number): void {
    this.waveView.step(dt);
  }
}
