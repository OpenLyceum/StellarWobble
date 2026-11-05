/**
 * ViewingAngleScreenView.ts
 *
 * The Viewing Angle screen: the size of the radial-velocity signal depends on
 * where Earth is.
 *
 *  - Left: the orbit in 3-D with the moving "To Earth" arrow, and below it the
 *    orbit as seen from Earth.
 *  - Middle: the radial velocity over one orbit against the edge-on ghost, and
 *    readouts of the measured and edge-on amplitudes, the true planet mass and
 *    the minimum mass we would infer.
 *  - Right: inclination, Earth's direction, and planet mass.
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, type TColor, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { TextPushButton } from "scenerystack/sun";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../../common/StellarWobbleButtonOptions.js";
import { StellarWobblePanel } from "../../common/StellarWobblePanel.js";
import { createEquationNode, createExplanationButton, createNumberControl } from "../../common/view/controls.js";
import { formatPlanetMass, formatSpeed, unitsDependencies } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  CONTROL_PANEL_WIDTH,
  EARTH_AZIMUTH_RANGE,
  FONTS,
  INCLINATION_RANGE,
  PLANET_MASS_RANGE,
  SCREEN_VIEW_MARGIN,
} from "../../StellarWobbleConstants.js";
import type { ViewingAngleModel } from "../model/ViewingAngleModel.js";
import { Orbit3DViewNode } from "./Orbit3DViewNode.js";
import { PhaseRVChartNode } from "./PhaseRVChartNode.js";
import { SkyViewNode } from "./SkyViewNode.js";
import { ViewingAngleScreenSummaryContent } from "./ViewingAngleScreenSummaryContent.js";

export type ViewingAngleScreenViewOptions = ScreenViewOptions;

const VIEW_3D_WIDTH = 390;
const VIEW_3D_HEIGHT = 330;
const SKY_VIEW_SIZE = 185;
const CHART_WIDTH = 270;
const CHART_HEIGHT = 200;
const READOUT_WIDTH = 300;

/** Below this inclination (degrees) the face-on warning is shown. */
const FACE_ON_WARNING_INCLINATION = 3;

export class ViewingAngleScreenView extends ScreenView {
  private readonly orbitView: Orbit3DViewNode;

  public constructor(model: ViewingAngleModel, providedOptions?: ViewingAngleScreenViewOptions) {
    const options = optionize<ViewingAngleScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new ViewingAngleScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getViewingAngleStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getViewingAngleA11yStrings();
    const system = model.system;
    const bounds = this.layoutBounds;

    // ── Views of the orbit ────────────────────────────────────────────────────
    this.orbitView = new Orbit3DViewNode(system, VIEW_3D_WIDTH, VIEW_3D_HEIGHT);
    this.orbitView.left = bounds.minX + SCREEN_VIEW_MARGIN;
    this.orbitView.top = bounds.minY + SCREEN_VIEW_MARGIN;

    const skyView = new SkyViewNode(system, SKY_VIEW_SIZE);
    skyView.left = this.orbitView.left;
    skyView.top = this.orbitView.bottom + 10;

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new PhaseRVChartNode(system, CHART_WIDTH, CHART_HEIGHT, strings.chartTitleStringProperty);
    chart.left = this.orbitView.right + 20;
    chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;

    // ── Readouts ──────────────────────────────────────────────────────────────
    const readout = (
      pattern: TReadOnlyProperty<string>,
      dependencies: readonly TReadOnlyProperty<unknown>[],
      format: () => string,
      fill: TColor = StellarWobbleColors.textColorProperty,
    ): RichText =>
      new RichText(
        new PatternStringProperty(pattern, {
          value: DerivedProperty.deriveAny([...dependencies, ...unitsDependencies()], format),
        }),
        { font: FONTS.READOUT, fill: fill, maxWidth: READOUT_WIDTH },
      );
    const measuredReadout = readout(
      strings.measuredAmplitudePatternStringProperty,
      [system.semiAmplitudeProperty],
      () => formatSpeed(system.semiAmplitudeProperty.value),
      StellarWobbleColors.rvCurveColorProperty,
    );
    const edgeOnReadout = readout(strings.edgeOnAmplitudePatternStringProperty, [system.edgeOnAmplitudeProperty], () =>
      formatSpeed(system.edgeOnAmplitudeProperty.value),
    );
    const trueMassReadout = readout(strings.trueMassPatternStringProperty, [system.planetMassProperty], () =>
      formatPlanetMass(system.planetMassProperty.value),
    );
    const minimumMassReadout = readout(
      strings.minimumMassPatternStringProperty,
      [model.minimumMassProperty],
      () => formatPlanetMass(model.minimumMassProperty.value),
      StellarWobbleColors.accentColorProperty,
    );
    const faceOnWarning = new RichText(strings.faceOnWarningStringProperty, {
      font: FONTS.READOUT,
      fill: StellarWobbleColors.redshiftColorProperty,
      lineWrap: READOUT_WIDTH,
      visibleProperty: new DerivedProperty(
        [system.inclinationProperty],
        (inclination) => inclination < FACE_ON_WARNING_INCLINATION,
      ),
    });
    const equation = createEquationNode(strings.equationStringProperty, READOUT_WIDTH);
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
    const explanationRow = new HBox({
      spacing: 8,
      children: [
        explanationButton,
        new Text(common.explanationButtonStringProperty, {
          font: FONTS.LABEL,
          fill: StellarWobbleColors.textColorProperty,
          maxWidth: READOUT_WIDTH - 40,
        }),
      ],
    });
    const readoutPanel = new StellarWobblePanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [
          measuredReadout,
          edgeOnReadout,
          trueMassReadout,
          minimumMassReadout,
          faceOnWarning,
          equation,
          explanationRow,
        ],
      }),
      { minWidth: READOUT_WIDTH + 24 },
    );
    readoutPanel.left = skyView.right + 15;
    readoutPanel.top = chart.bottom + 50;

    // ── Controls ──────────────────────────────────────────────────────────────
    const tickLabel = (label: TReadOnlyProperty<string>): Text =>
      new Text(label, { font: FONTS.SMALL, fill: StellarWobbleColors.textColorProperty, maxWidth: 60 });
    const inclinationControl = createNumberControl(
      strings.inclinationStringProperty,
      system.inclinationProperty,
      INCLINATION_RANGE,
      {
        unitsProperty: units.degreesStringProperty,
        compactUnits: true,
        significantFigures: 2,
        delta: 1,
        accessibleName: a11y.controls.inclinationStringProperty,
        numberControlOptions: {
          sliderOptions: {
            majorTicks: [
              { value: 0, label: tickLabel(strings.faceOnStringProperty) },
              { value: 90, label: tickLabel(strings.edgeOnStringProperty) },
            ],
            majorTickStroke: StellarWobbleColors.textColorProperty,
          },
        },
      },
    );
    const azimuthControl = createNumberControl(
      strings.earthAzimuthStringProperty,
      system.earthAzimuthProperty,
      EARTH_AZIMUTH_RANGE,
      {
        unitsProperty: units.degreesStringProperty,
        compactUnits: true,
        significantFigures: 3,
        delta: 5,
        accessibleName: a11y.controls.earthAzimuthStringProperty,
      },
    );
    const planetMassControl = createNumberControl(
      common.planetMassStringProperty,
      system.planetMassProperty,
      PLANET_MASS_RANGE,
      { unitsProperty: units.jupiterMassesStringProperty, logarithmic: true },
    );
    const resetViewButton = new TextPushButton(strings.resetViewStringProperty, {
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      font: FONTS.LABEL,
      textFill: LIGHT_SURFACE_TEXT_FILL,
      maxTextWidth: CONTROL_PANEL_WIDTH - 20,
      listener: () => this.orbitView.resetCamera(),
    });
    const controlPanel = new StellarWobblePanel(
      new VBox({
        spacing: 14,
        align: "left",
        children: [inclinationControl, azimuthControl, planetMassControl, resetViewButton],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );
    controlPanel.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    controlPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;

    // ── Time controls and Reset All ──────────────────────────────────────────
    const timeControlNode = new TimeControlNode(system.timer.isPlayingProperty, {
      timeSpeedProperty: system.timeSpeedProperty,
      timeSpeeds: [TimeSpeed.FAST, TimeSpeed.NORMAL, TimeSpeed.SLOW],
      ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
      playPauseStepButtonOptions: {
        ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
        stepForwardButtonOptions: {
          ...FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS.stepForwardButtonOptions,
          listener: () => system.advance(0.1),
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

    this.children = [this.orbitView, skyView, chart, readoutPanel, controlPanel, timeControlNode, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          inclinationControl,
          azimuthControl,
          planetMassControl,
          this.orbitView,
          resetViewButton,
          explanationButton,
          timeControlNode,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.orbitView.resetCamera();
  }
}
