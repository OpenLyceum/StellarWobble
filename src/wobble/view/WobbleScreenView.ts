/**
 * WobbleScreenView.ts
 *
 * The Wobble screen: a planet makes its star move in a small circle about their
 * centre of mass, and the star's spectral lines shift back and forth.
 *
 *  - Left: the view from above (TopViewNode), with a telescope-view option that
 *    hides what an astronomer cannot see, and the Hα zoom window below it.
 *  - Middle: the live radial-velocity chart and the readouts.
 *  - Right: the orbit sliders and display checkboxes.
 */

import { DerivedProperty, PatternStringProperty } from "scenerystack/axon";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton, TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { dopplerShift, H_ALPHA, shiftMagnification } from "../../common/model/stellarSpectrum.js";
import {
  FLAT_PLAY_PAUSE_STEP_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  TIME_CONTROL_SPEED_RADIO_OPTIONS,
} from "../../common/StellarWobbleButtonOptions.js";
import { StellarWobblePanel } from "../../common/StellarWobblePanel.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
} from "../../common/view/controls.js";
import { formatPeriod, formatSpeed, unitsDependencies } from "../../common/view/formatters.js";
import { SpectralLineZoomNode } from "../../common/view/SpectralLineZoomNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  CONTROL_PANEL_WIDTH,
  DISTANCE_RANGE,
  FONTS,
  PLANET_MASS_RANGE,
  SCREEN_VIEW_MARGIN,
  STAR_MASS_RANGE,
  ZOOM_HALF_WIDTH_NM,
  ZOOM_MAX_SHIFT_FRACTION,
} from "../../StellarWobbleConstants.js";
import type { WobbleModel } from "../model/WobbleModel.js";
import { LiveRVChartNode } from "./LiveRVChartNode.js";
import { TopViewNode } from "./TopViewNode.js";
import { WobbleScreenSummaryContent } from "./WobbleScreenSummaryContent.js";

export type WobbleScreenViewOptions = ScreenViewOptions;

const TOP_VIEW_SIZE = 340;
const CHART_WIDTH = 260;
const CHART_HEIGHT = 250;
const ZOOM_WIDTH = 290;

export class WobbleScreenView extends ScreenView {
  private readonly topView: TopViewNode;

  public constructor(model: WobbleModel, providedOptions?: WobbleScreenViewOptions) {
    const options = optionize<WobbleScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new WobbleScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getWobbleStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getWobbleA11yStrings();
    const system = model.system;
    const bounds = this.layoutBounds;

    // ── Top view and spectrum ─────────────────────────────────────────────────
    this.topView = new TopViewNode(system, TOP_VIEW_SIZE);
    this.topView.left = bounds.minX + SCREEN_VIEW_MARGIN;
    this.topView.top = bounds.minY + SCREEN_VIEW_MARGIN;

    const magnificationProperty = new DerivedProperty([system.semiAmplitudeProperty], (amplitude) =>
      shiftMagnification(dopplerShift(H_ALPHA.restWavelength, amplitude), ZOOM_MAX_SHIFT_FRACTION * ZOOM_HALF_WIDTH_NM),
    );
    const zoom = new SpectralLineZoomNode(H_ALPHA, system.radialVelocityProperty, magnificationProperty, {
      width: ZOOM_WIDTH,
    });
    zoom.left = this.topView.left;
    zoom.top = this.topView.bottom + 10;

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new LiveRVChartNode(system, CHART_WIDTH, CHART_HEIGHT, strings.chartTitleStringProperty);
    chart.left = this.topView.right + 20;
    chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;

    // ── Readouts ──────────────────────────────────────────────────────────────
    const readout = (pattern: typeof strings.periodPatternStringProperty, format: () => string): RichText =>
      new RichText(
        new PatternStringProperty(pattern, {
          value: DerivedProperty.deriveAny(
            [system.periodProperty, system.starSpeedProperty, system.planetSpeedProperty, ...unitsDependencies()],
            format,
          ),
        }),
        { font: FONTS.READOUT, fill: StellarWobbleColors.textColorProperty, maxWidth: CHART_WIDTH },
      );
    const periodReadout = readout(strings.periodPatternStringProperty, () => formatPeriod(system.periodProperty.value));
    const planetSpeedReadout = readout(strings.planetSpeedPatternStringProperty, () =>
      formatSpeed(system.planetSpeedProperty.value),
    );
    const starSpeedReadout = readout(strings.starSpeedPatternStringProperty, () =>
      formatSpeed(system.starSpeedProperty.value),
    );
    const equation = createEquationNode(strings.equationStringProperty, CHART_WIDTH);
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
          maxWidth: CHART_WIDTH - 40,
        }),
      ],
    });
    const readoutPanel = new StellarWobblePanel(
      new VBox({
        spacing: 6,
        align: "left",
        children: [periodReadout, planetSpeedReadout, starSpeedReadout, equation, explanationRow],
      }),
      { minWidth: CHART_WIDTH + 70 },
    );
    readoutPanel.left = this.topView.right + 20;
    readoutPanel.top = chart.bottom + 20;

    // ── Controls ──────────────────────────────────────────────────────────────
    const planetMassControl = createNumberControl(
      common.planetMassStringProperty,
      system.planetMassProperty,
      PLANET_MASS_RANGE,
      {
        unitsProperty: units.jupiterMassesStringProperty,
        logarithmic: true,
        accessibleName: a11y.controls.planetMassStringProperty,
      },
    );
    const distanceControl = createNumberControl(
      common.distanceStringProperty,
      system.distanceProperty,
      DISTANCE_RANGE,
      {
        unitsProperty: units.auStringProperty,
        logarithmic: true,
        accessibleName: a11y.controls.distanceStringProperty,
      },
    );
    const starMassControl = createNumberControl(
      common.starMassStringProperty,
      system.starMassProperty,
      STAR_MASS_RANGE,
      {
        unitsProperty: units.solarMassesStringProperty,
        significantFigures: 2,
        delta: 0.05,
        accessibleName: a11y.controls.starMassStringProperty,
      },
    );
    const telescopeCheckbox = createCheckbox(this.topView.telescopeViewProperty, strings.telescopeViewStringProperty);
    const velocityCheckbox = createCheckbox(this.topView.showVelocityProperty, strings.showVelocityStringProperty);

    const controlPanel = new StellarWobblePanel(
      new VBox({
        spacing: 12,
        align: "left",
        children: [planetMassControl, distanceControl, starMassControl, telescopeCheckbox, velocityCheckbox],
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

    this.children = [this.topView, zoom, chart, readoutPanel, controlPanel, timeControlNode, resetAllButton];

    this.addChild(
      new Node({
        pdomOrder: [
          planetMassControl,
          distanceControl,
          starMassControl,
          telescopeCheckbox,
          velocityCheckbox,
          explanationButton,
          timeControlNode,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.topView.reset();
  }
}
