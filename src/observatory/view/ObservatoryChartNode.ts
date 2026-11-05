/**
 * ObservatoryChartNode.ts
 *
 * The Observatory's data: each measurement as a point with its error bar,
 * against time (days) or, when folded, against phase on the user's period. The
 * user's model curve is drawn over the data, and the true signal once revealed
 * (in time mode only, because folding the true curve on a wrong period is not a
 * single curve).
 */

import { DerivedProperty, Multilink } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Text } from "scenerystack/scenery";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { niceStep } from "../../common/view/chartUtils.js";
import { niceCeil } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS } from "../../StellarWobbleConstants.js";
import type { ObservatoryModel } from "../model/ObservatoryModel.js";
import { signalVelocity } from "../model/PlanetSignal.js";

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

export class ObservatoryChartNode extends Node {
  public constructor(model: ObservatoryModel, width: number, height: number) {
    super();
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getObservatoryStrings();

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

    /** Sets the ranges to fit the data and curves; returns the x maximum (days, or 1 when folded). */
    const updateRanges = (): number => {
      const measurements = model.measurements;
      const lastTime = measurements[measurements.length - 1]?.time ?? 0;
      let xMax = 1;
      if (!model.foldProperty.value) {
        const span = Math.max(MIN_TIME_SPAN, lastTime * 1.05);
        const step = niceStep(span, 5);
        xMax = Math.ceil(span / step) * step;
      }
      let extent = Math.max(MIN_HALF_RANGE, model.showModelProperty.value ? model.fitAmplitudeProperty.value : 0);
      if (model.revealProperty.value) {
        extent = Math.max(extent, model.signalProperty.value.amplitude);
      }
      for (const measurement of measurements) {
        extent = Math.max(extent, Math.abs(measurement.velocity) + measurement.uncertainty);
      }
      const yMax = niceCeil(extent * 1.1);
      chart.setRanges(new Range(0, xMax), new Range(-yMax, yMax));
      return xMax;
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

    /** Samples a velocity curve over [0, xMax] with enough points per cycle. */
    const sampleCurve = (xMax: number, cycles: number, velocityAt: (x: number) => number): Vector2[] => {
      const count = Math.min(MAX_SAMPLES, Math.max(MIN_SAMPLES, Math.ceil(cycles * SAMPLES_PER_CYCLE)));
      return Array.from({ length: count + 1 }, (_, i) => {
        const x = (i / count) * xMax;
        return new Vector2(x, velocityAt(x));
      });
    };

    const update = (): void => {
      const fold = model.foldProperty.value;
      const fitPeriod = model.fitPeriodProperty.value;
      const signal = model.signalProperty.value;
      const xMax = updateRanges();
      updateData();

      fitPlot.visible = model.showModelProperty.value;
      if (fitPlot.visible) {
        fitPlot.setDataSet(
          sampleCurve(xMax, fold ? 1 : xMax / fitPeriod, (x) => model.fitVelocity(fold ? x * fitPeriod : x)),
        );
      }

      // The true signal (time mode only).
      answerPlot.visible = model.revealProperty.value && !fold;
      if (answerPlot.visible) {
        answerPlot.setDataSet(sampleCurve(xMax, xMax / signal.period, (time) => signalVelocity(signal, time)));
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
      ],
      update,
    );
    model.measurementsChangedEmitter.addListener(update);

    this.children = [chart, title];
    this.disposeEmitter.addListener(() => {
      multilink.dispose();
      model.measurementsChangedEmitter.removeListener(update);
      xAxisLabelProperty.dispose();
    });
  }
}
