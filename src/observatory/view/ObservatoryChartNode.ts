/**
 * ObservatoryChartNode.ts
 *
 * The Observatory's data: each measurement as a point with its error bar,
 * against time (days) or, when folded, against phase on the user's period. The
 * user's model curve is drawn over the data, and the true signal once revealed
 * (in time mode only, because folding the true curve on a wrong period is not a
 * single curve).
 *
 * In time mode the user can zoom in on the time axis and scroll along it: drag
 * the chart sideways, turn the mouse wheel over it (sideways scrolling or
 * shift+wheel scrolls), or use the buttons below it. "Show all" (or zooming all
 * the way out) returns to the whole run, which then grows with the data again.
 */

import { DerivedProperty, Multilink, NumberProperty, Property } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { DragListener, HBox, Line, Node, Path, Rectangle, type SceneryEvent, Text, VBox } from "scenerystack/scenery";
import { ZoomButton } from "scenerystack/scenery-phet";
import { ArrowButton, TextPushButton } from "scenerystack/sun";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/StellarWobbleButtonOptions.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { niceStep } from "../../common/view/chartUtils.js";
import { niceCeil } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS } from "../../StellarWobbleConstants.js";
import type { ObservatoryModel } from "../model/ObservatoryModel.js";
import { signalVelocity } from "../model/PlanetSignal.js";
import { panTimeWindow, zoomTimeWindow } from "./timeWindow.js";

/** Smallest time span shown, days. */
const MIN_TIME_SPAN = 10;

/** Smallest velocity half-range shown, m/s. */
const MIN_HALF_RANGE = 5;

const POINT_RADIUS = 3;
const ERROR_CAP = 3;

/** Model-curve samples per cycle, and the limits on the total. */
const SAMPLES_PER_CYCLE = 40;
const MIN_SAMPLES = 200;
const MAX_SAMPLES = 5000;

/** Narrowest time window the user can zoom in to, days. */
const MIN_WINDOW_SPAN = 1;

/** Zoom factor of one press of a zoom button. */
const BUTTON_ZOOM_FACTOR = 2;

/** Fraction of the window that one press of a scroll button moves it (the buttons repeat when held). */
const BUTTON_SCROLL_FRACTION = 0.2;

/** Zoom per pixel of vertical wheel motion: the window scales by exp(deltaY × this). */
const WHEEL_ZOOM_PER_PIXEL = 0.002;

/** Wheel deltas in lines (Firefox) are converted to pixels with this factor. */
const PIXELS_PER_WHEEL_LINE = 25;

/** Height of the zoom and scroll buttons. */
const BUTTON_SIZE = 26;

export class ObservatoryChartNode extends Node {
  /** The zoom and scroll buttons, in focus order, for the screen's pdomOrder. */
  public readonly timeControls: readonly Node[];

  /** Days shown on the time axis; null shows the whole run (from day 0 to the latest night). */
  private readonly timeWindowProperty = new Property<Range | null>(null);

  public constructor(model: ObservatoryModel, width: number, height: number) {
    super();
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getObservatoryStrings();
    const a11y = StringManager.getInstance().getObservatoryA11yStrings();

    /** End of the whole run on the time axis, days (the right edge when nothing is zoomed). */
    const fullTimeMaxProperty = new NumberProperty(MIN_TIME_SPAN);

    const xAxisLabelProperty = new DerivedProperty(
      [model.foldProperty, common.timeAxisStringProperty, strings.phaseAxisStringProperty],
      (fold, time, phase) => (fold ? phase : time),
    );
    const chart = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, MIN_TIME_SPAN),
      yRange: new Range(-MIN_HALF_RANGE, MIN_HALF_RANGE),
      xAxisLabelProperty: xAxisLabelProperty,
      yAxisLabelProperty: common.radialVelocityAxisStringProperty,
    });
    const transform = chart.chartTransform;

    const zeroLine = new Line(0, height / 2, width, height / 2, {
      stroke: StellarWobbleColors.chartZeroLineColorProperty,
    });
    const answerPlot = new LinePlot(transform, [], {
      stroke: StellarWobbleColors.answerCurveColorProperty,
      lineWidth: 2,
      lineDash: [6, 4],
    });
    const fitPlot = new LinePlot(transform, [], {
      stroke: StellarWobbleColors.fitCurveColorProperty,
      lineWidth: 2.5,
    });
    const errorBars = new Path(null, { stroke: StellarWobbleColors.measurementColorProperty, lineWidth: 1 });
    const points = new Path(null, {
      fill: StellarWobbleColors.measurementColorProperty,
      stroke: StellarWobbleColors.chartBackgroundColorProperty,
      lineWidth: 0.5,
    });
    chart.plotLayer.children = [zeroLine, answerPlot, fitPlot, errorBars, points];

    const noData = new Text(strings.noDataStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width - 20,
    });
    noData.boundsProperty.link(() => {
      noData.centerX = width / 2;
      noData.bottom = height / 2 - 10;
    });
    chart.overlayLayer.addChild(noData);

    const title = new Text(strings.chartTitleStringProperty, {
      font: FONTS.TITLE,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });
    title.boundsProperty.link(() => {
      title.centerX = width / 2;
      title.bottom = -6;
    });

    /** Sets the ranges to fit the data and curves; returns the x range (days, or phase 0–1 when folded). */
    const updateRanges = (): Range => {
      const measurements = model.measurements;
      const lastTime = measurements[measurements.length - 1]?.time ?? 0;
      const fullSpan = Math.max(MIN_TIME_SPAN, lastTime * 1.05);
      const fullStep = niceStep(fullSpan, 5);
      fullTimeMaxProperty.value = Math.ceil(fullSpan / fullStep) * fullStep;
      const xRange = model.foldProperty.value
        ? new Range(0, 1)
        : (this.timeWindowProperty.value ?? new Range(0, fullTimeMaxProperty.value));
      let extent = Math.max(MIN_HALF_RANGE, model.showModelProperty.value ? model.fitAmplitudeProperty.value : 0);
      if (model.revealProperty.value) {
        extent = Math.max(extent, model.signalProperty.value.amplitude);
      }
      for (const measurement of measurements) {
        extent = Math.max(extent, Math.abs(measurement.velocity) + measurement.uncertainty);
      }
      const yMax = niceCeil(extent * 1.1);
      chart.setRanges(xRange, new Range(-yMax, yMax));
      return xRange;
    };

    /** Draws each measurement as a point with its error bar. */
    const updateData = (): void => {
      const fold = model.foldProperty.value;
      const fitPeriod = model.fitPeriodProperty.value;
      const pointShape = new Shape();
      const barShape = new Shape();
      for (const measurement of model.measurements) {
        const x = fold ? (((measurement.time / fitPeriod) % 1) + 1) % 1 : measurement.time;
        const view = transform.modelToViewPosition(new Vector2(x, measurement.velocity));
        const top = transform.modelToViewY(measurement.velocity + measurement.uncertainty);
        const bottom = transform.modelToViewY(measurement.velocity - measurement.uncertainty);
        barShape.moveTo(view.x, top).lineTo(view.x, bottom);
        barShape.moveTo(view.x - ERROR_CAP, top).lineTo(view.x + ERROR_CAP, top);
        barShape.moveTo(view.x - ERROR_CAP, bottom).lineTo(view.x + ERROR_CAP, bottom);
        pointShape.circle(view.x, view.y, POINT_RADIUS);
        pointShape.newSubpath();
      }
      points.shape = pointShape;
      errorBars.shape = barShape;
      noData.visible = model.measurements.length === 0;
    };

    /** Samples a velocity curve over the x range with enough points per cycle. */
    const sampleCurve = (xRange: Range, cycles: number, velocityAt: (x: number) => number): Vector2[] => {
      const count = Math.min(MAX_SAMPLES, Math.max(MIN_SAMPLES, Math.ceil(cycles * SAMPLES_PER_CYCLE)));
      return Array.from({ length: count + 1 }, (_, i) => {
        const x = xRange.min + (i / count) * xRange.getLength();
        return new Vector2(x, velocityAt(x));
      });
    };

    const update = (): void => {
      const fold = model.foldProperty.value;
      const fitPeriod = model.fitPeriodProperty.value;
      const signal = model.signalProperty.value;
      const xRange = updateRanges();
      updateData();

      fitPlot.visible = model.showModelProperty.value;
      if (fitPlot.visible) {
        fitPlot.setDataSet(
          sampleCurve(xRange, fold ? 1 : xRange.getLength() / fitPeriod, (x) =>
            model.fitVelocity(fold ? x * fitPeriod : x),
          ),
        );
      }

      // The true signal (time mode only).
      answerPlot.visible = model.revealProperty.value && !fold;
      if (answerPlot.visible) {
        answerPlot.setDataSet(
          sampleCurve(xRange, xRange.getLength() / signal.period, (time) => signalVelocity(signal, time)),
        );
      }
    };

    const multilink = Multilink.multilinkAny(
      [
        model.foldProperty,
        model.showModelProperty,
        model.revealProperty,
        model.fitPeriodProperty,
        model.fitAmplitudeProperty,
        model.fitPhaseProperty,
        model.signalProperty,
        this.timeWindowProperty,
      ],
      update,
    );
    // New target or cleared data: go back to the whole run.
    const onMeasurementsChanged = (): void => {
      if (model.measurements.length === 0) {
        this.timeWindowProperty.value = null;
      }
      update();
    };
    model.measurementsChangedEmitter.addListener(onMeasurementsChanged);

    // ── Zooming and scrolling the time axis ───────────────────────────────────
    const fullTimeRange = (): Range => new Range(0, fullTimeMaxProperty.value);
    const shownTimeRange = (): Range => this.timeWindowProperty.value ?? fullTimeRange();
    const zoom = (factor: number, anchor = shownTimeRange().getCenter()): void => {
      if (!model.foldProperty.value) {
        this.timeWindowProperty.value = zoomTimeWindow(
          shownTimeRange(),
          factor,
          anchor,
          fullTimeRange(),
          MIN_WINDOW_SPAN,
        );
      }
    };
    const scroll = (delta: number): void => {
      const timeWindow = this.timeWindowProperty.value;
      if (timeWindow && !model.foldProperty.value) {
        this.timeWindowProperty.value = panTimeWindow(timeWindow, delta, fullTimeRange());
      }
    };

    // Drag and wheel over the plot. The wheel is handled here so it does not also pan the whole sim.
    const dragArea = new Rectangle(0, 0, width, height, { fill: "rgba(0,0,0,0)", cursor: "ew-resize" });
    let lastDragX = 0;
    dragArea.addInputListener(
      new DragListener({
        start: (event) => {
          lastDragX = dragArea.globalToLocalPoint(event.pointer.point).x;
        },
        drag: (event) => {
          const x = dragArea.globalToLocalPoint(event.pointer.point).x;
          scroll(((lastDragX - x) / width) * shownTimeRange().getLength());
          lastDragX = x;
        },
      }),
    );
    dragArea.addInputListener({
      wheel: (event: SceneryEvent<WheelEvent>) => {
        const domEvent = event.domEvent;
        if (!domEvent || model.foldProperty.value) {
          return;
        }
        domEvent.preventDefault();
        event.handle();
        const scale = domEvent.deltaMode === WheelEvent.DOM_DELTA_LINE ? PIXELS_PER_WHEEL_LINE : 1;
        const sideways = domEvent.shiftKey ? domEvent.deltaY : domEvent.deltaX;
        if (Math.abs(sideways) > Math.abs(domEvent.deltaY) || domEvent.shiftKey) {
          scroll(((sideways * scale) / width) * shownTimeRange().getLength());
        } else {
          const x = dragArea.globalToLocalPoint(event.pointer.point).x;
          zoom(Math.exp(domEvent.deltaY * scale * WHEEL_ZOOM_PER_PIXEL), transform.viewToModelX(x));
        }
      },
    });
    chart.addChild(dragArea);
    noData.moveToFront();

    // Buttons below the chart.
    const buttonOptions = { ...FLAT_PANEL_PUSH_BUTTON_OPTIONS, minHeight: BUTTON_SIZE, minWidth: BUTTON_SIZE };
    const scrollEarlierButton = new ArrowButton(
      "left",
      () => scroll(-BUTTON_SCROLL_FRACTION * shownTimeRange().getLength()),
      {
        ...buttonOptions,
        arrowHeight: 12,
        arrowWidth: 12,
        accessibleName: a11y.controls.scrollEarlierStringProperty,
      },
    );
    const scrollLaterButton = new ArrowButton(
      "right",
      () => scroll(BUTTON_SCROLL_FRACTION * shownTimeRange().getLength()),
      {
        ...buttonOptions,
        arrowHeight: 12,
        arrowWidth: 12,
        accessibleName: a11y.controls.scrollLaterStringProperty,
      },
    );
    const zoomOutButton = new ZoomButton({
      ...buttonOptions,
      in: false,
      magnifyingGlassOptions: { glassRadius: 7 },
      listener: () => zoom(BUTTON_ZOOM_FACTOR),
      accessibleName: a11y.controls.zoomOutStringProperty,
    });
    const zoomInButton = new ZoomButton({
      ...buttonOptions,
      in: true,
      magnifyingGlassOptions: { glassRadius: 7 },
      listener: () => zoom(1 / BUTTON_ZOOM_FACTOR),
      accessibleName: a11y.controls.zoomInStringProperty,
    });
    const showAllButton = new TextPushButton(strings.showAllStringProperty, {
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      font: FONTS.LABEL,
      textFill: LIGHT_SURFACE_TEXT_FILL,
      maxTextWidth: 110,
      minHeight: BUTTON_SIZE,
      listener: () => {
        this.timeWindowProperty.value = null;
      },
      accessibleName: a11y.controls.showAllStringProperty,
    });
    const hint = new Text(strings.chartHintStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width,
    });
    const controls = new VBox({
      spacing: 4,
      children: [
        new HBox({
          spacing: 6,
          children: [scrollEarlierButton, zoomOutButton, zoomInButton, scrollLaterButton, showAllButton],
        }),
        hint,
      ],
    });
    controls.boundsProperty.link(() => {
      controls.centerX = width / 2;
      controls.top = chart.bottom + 6;
    });
    this.timeControls = [scrollEarlierButton, zoomOutButton, zoomInButton, scrollLaterButton, showAllButton];

    const enabledMultilink = Multilink.multilink(
      [model.foldProperty, this.timeWindowProperty, fullTimeMaxProperty],
      (fold, timeWindow, fullTimeMax) => {
        const zoomed = !fold && timeWindow !== null;
        zoomInButton.enabled = !fold && (timeWindow ?? new Range(0, fullTimeMax)).getLength() > MIN_WINDOW_SPAN * 1.001;
        zoomOutButton.enabled = zoomed;
        showAllButton.enabled = zoomed;
        scrollEarlierButton.enabled = zoomed && timeWindow.min > 0;
        scrollLaterButton.enabled = zoomed && timeWindow.max < fullTimeMax;
        dragArea.pickable = !fold;
        hint.visible = !fold;
      },
    );

    this.children = [chart, title, controls];
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      enabledMultilink.dispose();
      model.measurementsChangedEmitter.removeListener(onMeasurementsChanged);
      xAxisLabelProperty.dispose();
    });
  }

  /** Shows the whole run again. */
  public reset(): void {
    this.timeWindowProperty.reset();
  }
}
