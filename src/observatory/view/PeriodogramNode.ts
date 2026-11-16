import { PERIODOGRAM_NODE_SETTINGS } from "../../StellarWobbleConstants.js";
/**
 * PeriodogramNode.ts
 *
 * The Observatory's periodogram, shown in place of the measurements when
 * "Periodogram" is checked: for every trial period (log axis, 1 to 5000 days),
 * how much of the data's scatter a sine of that period explains. The user's
 * period is marked, and the true period once the answer is revealed.
 *
 * Clicking near a peak uses that peak's period for the model; the button below
 * uses the highest peak. Observing once a night also makes alias peaks near
 * 1 day and at P/(1 ± P) days, which the explanation dialog mentions.
 */

import { Multilink, PatternStringProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, type SceneryEvent, Text } from "scenerystack/scenery";
import { TextPushButton } from "scenerystack/sun";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/StellarWobbleButtonOptions.js";
import { formatTickValue } from "../../common/view/chartUtils.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FIT_PERIOD_RANGE_DAYS, FONTS, PERIODOGRAM_MIN_MEASUREMENTS } from "../../StellarWobbleConstants.js";
import type { ObservatoryModel } from "../model/ObservatoryModel.js";

/** Labelled periods on the log axis, days. */
const PERIOD_TICKS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

/** Power gridlines. */
const POWER_TICKS = [0, 0.25, 0.5, 0.75, 1];

/** A click picks the highest peak within this many pixels of it. */
const CLICK_PICK_PIXELS: number = PERIODOGRAM_NODE_SETTINGS.CLICK_PICK_PIXELS;

/** Height of the button below the plot. */
const BUTTON_HEIGHT: number = PERIODOGRAM_NODE_SETTINGS.BUTTON_HEIGHT;

export class PeriodogramNode extends Node {
  /** The button below the plot, for the screen's pdomOrder. */
  public readonly usePeakButton: TextPushButton;

  public constructor(model: ObservatoryModel, width: number, height: number) {
    super();
    const strings = StringManager.getInstance().getObservatoryStrings();
    const a11y = StringManager.getInstance().getObservatoryA11yStrings();

    const logMin = Math.log10(FIT_PERIOD_RANGE_DAYS.min);
    const logMax = Math.log10(FIT_PERIOD_RANGE_DAYS.max);
    const periodToX = (period: number): number => ((Math.log10(period) - logMin) / (logMax - logMin)) * width;
    const xToPeriod = (x: number): number => 10 ** (logMin + (x / width) * (logMax - logMin));
    const powerToY = (power: number): number => height * (1 - power);

    // ── Frame ─────────────────────────────────────────────────────────────────
    const background = new Rectangle(0, 0, width, height, {
      fill: StellarWobbleColors.chartBackgroundColorProperty,
      stroke: StellarWobbleColors.chartAxisColorProperty,
      cursor: "pointer",
    });
    const gridShape = new Shape();
    const tickShape = new Shape();
    const tickLabels = new Node();
    for (const period of PERIOD_TICKS) {
      const x = periodToX(period);
      gridShape.moveTo(x, 0).lineTo(x, height);
      tickShape.moveTo(x, height).lineTo(x, height + 5);
      tickLabels.addChild(
        new Text(formatTickValue(period, 0), {
          font: FONTS.TICK_LABEL,
          fill: StellarWobbleColors.textColorProperty,
          centerX: x,
          top: height + PERIODOGRAM_NODE_SETTINGS.CONSTRUCTOR_TOP_OFFSET,
        }),
      );
    }
    for (const power of POWER_TICKS) {
      const y = powerToY(power);
      gridShape.moveTo(0, y).lineTo(width, y);
      tickShape.moveTo(PERIODOGRAM_NODE_SETTINGS.CONSTRUCTOR_X, y).lineTo(0, y);
      tickLabels.addChild(
        new Text(formatTickValue(power, String(power).split(".")[1]?.length ?? 0), {
          font: FONTS.TICK_LABEL,
          fill: StellarWobbleColors.textColorProperty,
          right: PERIODOGRAM_NODE_SETTINGS.CONSTRUCTOR_RIGHT,
          centerY: y,
        }),
      );
    }
    const grid = new Path(gridShape, { stroke: StellarWobbleColors.chartGridColorProperty, pickable: false });
    const ticks = new Path(tickShape, { stroke: StellarWobbleColors.chartAxisColorProperty });

    const xAxisLabel = new Text(strings.periodogramPeriodAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });
    xAxisLabel.boundsProperty.link(() => {
      xAxisLabel.centerX = width / 2;
      xAxisLabel.top = height + 20;
    });
    const yAxisLabel = new Text(strings.periodogramPowerAxisStringProperty, {
      font: FONTS.AXIS_LABEL,
      fill: StellarWobbleColors.textColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: height,
    });
    yAxisLabel.boundsProperty.link(() => {
      yAxisLabel.centerY = height / 2;
      yAxisLabel.right = PERIODOGRAM_NODE_SETTINGS.RIGHT_RIGHT;
    });
    const title = new Text(strings.periodogramTitleStringProperty, {
      font: FONTS.TITLE,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });
    title.boundsProperty.link(() => {
      title.centerX = width / 2;
      title.bottom = PERIODOGRAM_NODE_SETTINGS.BOTTOM_BOTTOM;
    });

    // ── Curve and markers ─────────────────────────────────────────────────────
    const curve = new Path(null, {
      stroke: StellarWobbleColors.measurementColorProperty,
      lineWidth: PERIODOGRAM_NODE_SETTINGS.CURVE_LINE_WIDTH,
      pickable: false,
    });
    const fitLine = new Line(0, 0, 0, height, {
      stroke: StellarWobbleColors.fitCurveColorProperty,
      lineWidth: PERIODOGRAM_NODE_SETTINGS.FIT_LINE_LINE_WIDTH,
      pickable: false,
    });
    const answerLine = new Line(0, 0, 0, height, {
      stroke: StellarWobbleColors.answerCurveColorProperty,
      lineWidth: PERIODOGRAM_NODE_SETTINGS.ANSWER_LINE_LINE_WIDTH,
      lineDash: [
        PERIODOGRAM_NODE_SETTINGS.ANSWER_LINE_LINE_DASH_DASH,
        PERIODOGRAM_NODE_SETTINGS.CONSTRUCTOR_ANSWER_LINE_LINE_DASH_DASH,
      ],
      pickable: false,
    });
    const plotLayer = new Node({
      clipArea: Shape.rect(0, 0, width, height),
      children: [curve, answerLine, fitLine],
      pickable: false,
    });
    const message = new Text(
      new PatternStringProperty(strings.periodogramNeedDataPatternStringProperty, {
        count: PERIODOGRAM_MIN_MEASUREMENTS,
      }),
      {
        font: FONTS.LABEL,
        fill: StellarWobbleColors.mutedTextColorProperty,
        maxWidth: width - PERIODOGRAM_NODE_SETTINGS.MESSAGE_MAX_WIDTH_OFFSET,
        pickable: false,
      },
    );
    message.boundsProperty.link(() => {
      message.centerX = width / 2;
      message.centerY = height / 2;
    });

    // ── Interaction ───────────────────────────────────────────────────────────
    background.addInputListener({
      down: (event: SceneryEvent) => {
        const x = background.globalToLocalPoint(event.pointer.point).x;
        const low = xToPeriod(Math.max(0, x - CLICK_PICK_PIXELS));
        const high = xToPeriod(Math.min(width, x + CLICK_PICK_PIXELS));
        model.usePeakPeriod(low, high);
      },
    });
    this.usePeakButton = new TextPushButton(strings.usePeakStringProperty, {
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      font: FONTS.LABEL,
      textFill: LIGHT_SURFACE_TEXT_FILL,
      maxTextWidth: 200,
      minHeight: BUTTON_HEIGHT,
      listener: () => model.usePeakPeriod(),
      accessibleName: a11y.controls.usePeakStringProperty,
    });
    const hint = new Text(strings.periodogramHintStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width - PERIODOGRAM_NODE_SETTINGS.HINT_MAX_WIDTH_OFFSET,
    });
    const placeControls = (): void => {
      const top = height + 44;
      const total = this.usePeakButton.width + 12 + hint.width;
      this.usePeakButton.left = width / 2 - total / 2;
      this.usePeakButton.top = top;
      hint.left = this.usePeakButton.right + PERIODOGRAM_NODE_SETTINGS.PLACE_CONTROLS_LEFT_OFFSET;
      hint.centerY = this.usePeakButton.centerY;
    };
    this.usePeakButton.boundsProperty.lazyLink(placeControls);
    hint.boundsProperty.lazyLink(placeControls);
    placeControls();

    // ── Updates ───────────────────────────────────────────────────────────────
    /** Redraws the curve as the highest power in each pixel column, so no peak is lost. */
    const updateCurve = (): void => {
      const periodogram = model.periodogram();
      message.visible = periodogram === null;
      this.usePeakButton.enabled = periodogram !== null;
      if (!periodogram) {
        curve.shape = null;
        return;
      }
      const columns = new Float64Array(Math.ceil(width) + 1).fill(-1);
      const { frequencies, power } = periodogram;
      for (let k = 0; k < frequencies.length; k++) {
        const column = Math.round(periodToX(1 / (frequencies[k] ?? 1)));
        if (column >= 0 && column < columns.length) {
          columns[column] = Math.max(columns[column] ?? -1, power[k] ?? 0);
        }
      }
      const shape = new Shape();
      let started = false;
      columns.forEach((value, column) => {
        if (value < 0) {
          return;
        }
        const y = powerToY(value);
        if (started) {
          shape.lineTo(column, y);
        } else {
          shape.moveTo(column, y);
          started = true;
        }
      });
      curve.shape = shape;
    };

    const placeMarkers = (): void => {
      const fitX = periodToX(model.fitPeriodProperty.value);
      fitLine.setLine(fitX, 0, fitX, height);
      answerLine.visible = model.revealProperty.value;
      const trueX = periodToX(FIT_PERIOD_RANGE_DAYS.constrainValue(model.signalProperty.value.period));
      answerLine.setLine(trueX, 0, trueX, height);
    };

    let curveStale = true;
    const refresh = (): void => {
      if (this.visible) {
        if (curveStale) {
          updateCurve();
          curveStale = false;
        }
        placeMarkers();
      }
    };
    const onMeasurementsChanged = (): void => {
      curveStale = true;
      refresh();
    };
    model.measurementsChangedEmitter.addListener(onMeasurementsChanged);
    const multilink = Multilink.multilinkAny(
      [model.fitPeriodProperty, model.revealProperty, model.signalProperty, model.showPeriodogramProperty],
      refresh,
    );
    this.visibleProperty.lazyLink(refresh);

    this.children = [
      background,
      grid,
      plotLayer,
      ticks,
      tickLabels,
      xAxisLabel,
      yAxisLabel,
      title,
      message,
      this.usePeakButton,
      hint,
    ];

    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      model.measurementsChangedEmitter.removeListener(onMeasurementsChanged);
    });
  }
}
