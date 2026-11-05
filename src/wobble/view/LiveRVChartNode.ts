/**
 * LiveRVChartNode.ts
 *
 * The star's radial velocity traced live against time (days) as the system
 * runs, over TRACE_ORBITS orbits. When the trace reaches the right edge it
 * starts again from the left, like an oscilloscope sweep. The upper half
 * (moving away, redshift) and lower half (moving toward us, blueshift) are
 * tinted to match the spectral shift.
 *
 * The ranges follow the period and the semi-amplitude K, so the curve always
 * fills the chart: the axis labels, not the height of the curve, show how big
 * the wobble is.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Circle, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import type { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { niceCeil } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { DAY_S, FONTS, TRACE_ORBITS } from "../../StellarWobbleConstants.js";

/** Fraction of the y range left above the curve's peak. */
const HEADROOM = 1.15;

export class LiveRVChartNode extends Node {
  public constructor(system: OrbitalSystem, width: number, height: number, titleProperty: TReadOnlyProperty<string>) {
    super();
    const common = StringManager.getInstance().getCommonStrings();

    const chart = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, 1),
      yRange: new Range(-1, 1),
      xAxisLabelProperty: common.timeAxisStringProperty,
      yAxisLabelProperty: common.radialVelocityAxisStringProperty,
    });
    const transform = chart.chartTransform;

    // Tinted halves: above zero the star moves away (red), below toward us (blue).
    const awayTint = new Rectangle(0, 0, width, height / 2, {
      fill: StellarWobbleColors.redshiftColorProperty,
      opacity: 0.08,
    });
    const towardTint = new Rectangle(0, height / 2, width, height / 2, {
      fill: StellarWobbleColors.blueshiftColorProperty,
      opacity: 0.08,
    });
    const tintLabelOptions = { font: FONTS.SMALL, maxWidth: width / 2 };
    const awayLabel = new Text(common.movingAwayStringProperty, {
      ...tintLabelOptions,
      fill: StellarWobbleColors.redshiftColorProperty,
      left: 4,
      top: 2,
    });
    const towardLabel = new Text(common.movingTowardStringProperty, {
      ...tintLabelOptions,
      fill: StellarWobbleColors.blueshiftColorProperty,
      left: 4,
      bottom: height - 2,
    });
    const zeroLine = new Line(0, height / 2, width, height / 2, {
      stroke: StellarWobbleColors.chartZeroLineColorProperty,
    });

    const tracePlot = new LinePlot(transform, [], {
      stroke: StellarWobbleColors.rvCurveColorProperty,
      lineWidth: 2.5,
    });
    const currentPoint = new Circle(5, {
      fill: StellarWobbleColors.rvCurveColorProperty,
      stroke: StellarWobbleColors.chartBackgroundColorProperty,
    });

    chart.plotLayer.children = [awayTint, towardTint, zeroLine, awayLabel, towardLabel, tracePlot];
    chart.overlayLayer.addChild(currentPoint);

    const title = new Text(titleProperty, {
      font: FONTS.TITLE,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });
    title.boundsProperty.link(() => {
      title.centerX = width / 2;
      title.bottom = -6;
    });

    let periodDays = 1;
    const rangeMultilink = Multilink.multilink(
      [system.periodProperty, system.edgeOnAmplitudeProperty],
      (period, edgeOnAmplitude) => {
        periodDays = period / DAY_S;
        const yMax = niceCeil(edgeOnAmplitude * HEADROOM);
        chart.setRanges(new Range(0, TRACE_ORBITS * periodDays), new Range(-yMax, yMax));
        updateTrace();
      },
    );

    function updateTrace(): void {
      const points = system.trace.map((point) => new Vector2(point.x * periodDays, point.y));
      tracePlot.setDataSet(points);
      const last = points[points.length - 1];
      currentPoint.visible = last !== undefined;
      if (last) {
        currentPoint.center = transform.modelToViewPosition(last);
      }
    }
    system.traceChangedEmitter.addListener(updateTrace);
    updateTrace();

    this.children = [chart, title];

    this.disposeEmitter.addListener(() => {
      rangeMultilink.dispose();
      system.traceChangedEmitter.removeListener(updateTrace);
    });
  }
}
