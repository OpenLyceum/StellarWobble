/**
 * PhaseRVChartNode.ts
 *
 * The star's radial velocity over one orbit (phase 0–1) for the current
 * viewpoint, with a faint dashed ghost of the curve an edge-on observer would
 * see. The y range is fixed by the edge-on amplitude, so tilting the orbit
 * visibly flattens the curve, down to a flat line face-on. A cursor follows the
 * animation.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { LinePlot } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Circle, HBox, Line, Node, Rectangle, Text } from "scenerystack/scenery";
import type { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { radialVelocityAtPhase } from "../../common/model/orbitPhysics.js";
import { ChartFrameNode } from "../../common/view/ChartFrameNode.js";
import { niceCeil } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS } from "../../StellarWobbleConstants.js";

const DEG = Math.PI / 180;
const SAMPLES = 120;
const HEADROOM = 1.15;

export class PhaseRVChartNode extends Node {
  public constructor(system: OrbitalSystem, width: number, height: number, titleProperty: TReadOnlyProperty<string>) {
    super();
    const strings = StringManager.getInstance().getViewingAngleStrings();
    const common = StringManager.getInstance().getCommonStrings();

    const chart = new ChartFrameNode({
      viewWidth: width,
      viewHeight: height,
      xRange: new Range(0, 1),
      yRange: new Range(-1, 1),
      xAxisLabelProperty: strings.phaseAxisStringProperty,
      yAxisLabelProperty: common.radialVelocityAxisStringProperty,
      targetDivisions: 4,
    });
    const transform = chart.chartTransform;

    const awayTint = new Rectangle(0, 0, width, height / 2, {
      fill: StellarWobbleColors.redshiftColorProperty,
      opacity: 0.08,
    });
    const towardTint = new Rectangle(0, height / 2, width, height / 2, {
      fill: StellarWobbleColors.blueshiftColorProperty,
      opacity: 0.08,
    });
    const zeroLine = new Line(0, height / 2, width, height / 2, {
      stroke: StellarWobbleColors.chartZeroLineColorProperty,
    });
    const ghostPlot = new LinePlot(transform, [], {
      stroke: StellarWobbleColors.ghostCurveColorProperty,
      lineWidth: 2,
      lineDash: [6, 4],
    });
    const curvePlot = new LinePlot(transform, [], {
      stroke: StellarWobbleColors.rvCurveColorProperty,
      lineWidth: 2.5,
    });
    const cursor = new Line(0, 0, 0, height, { stroke: StellarWobbleColors.cursorColorProperty, opacity: 0.6 });
    const cursorDot = new Circle(5, {
      fill: StellarWobbleColors.rvCurveColorProperty,
      stroke: StellarWobbleColors.chartBackgroundColorProperty,
    });
    chart.plotLayer.children = [awayTint, towardTint, zeroLine, ghostPlot, curvePlot, cursor];
    chart.overlayLayer.addChild(cursorDot);

    const title = new Text(titleProperty, {
      font: FONTS.TITLE,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });
    title.boundsProperty.link(() => {
      title.centerX = width / 2;
      title.bottom = -6;
    });

    // Legend for the ghost curve.
    const legend = new HBox({
      spacing: 5,
      children: [
        new Line(0, 0, 22, 0, { stroke: StellarWobbleColors.ghostCurveColorProperty, lineWidth: 2, lineDash: [6, 4] }),
        new Text(strings.edgeOnCurveStringProperty, {
          font: FONTS.SMALL,
          fill: StellarWobbleColors.mutedTextColorProperty,
          maxWidth: width / 2,
        }),
      ],
    });
    legend.boundsProperty.link(() => {
      legend.right = width - 4;
      legend.top = 3;
    });
    chart.overlayLayer.addChild(legend);

    const curveMultilink = Multilink.multilink(
      [system.semiAmplitudeProperty, system.edgeOnAmplitudeProperty, system.earthAzimuthProperty],
      (amplitude, edgeOnAmplitude, azimuth) => {
        const yMax = niceCeil(edgeOnAmplitude * HEADROOM);
        chart.setRanges(new Range(0, 1), new Range(-yMax, yMax));
        const sample = (k: number): Vector2[] =>
          Array.from({ length: SAMPLES + 1 }, (_, i) => {
            const phase = i / SAMPLES;
            return new Vector2(phase, radialVelocityAtPhase(phase, k, azimuth * DEG));
          });
        ghostPlot.setDataSet(sample(edgeOnAmplitude));
        curvePlot.setDataSet(sample(amplitude));
      },
    );
    const cursorMultilink = Multilink.multilink(
      [system.phaseProperty, system.radialVelocityProperty, system.edgeOnAmplitudeProperty],
      (phase, radialVelocity) => {
        const x = transform.modelToViewX(phase);
        cursor.setLine(x, 0, x, height);
        cursorDot.center = transform.modelToViewPosition(new Vector2(phase, radialVelocity));
      },
    );

    this.children = [chart, title];
    this.disposeEmitter.addListener(() => {
      curveMultilink.dispose();
      cursorMultilink.dispose();
    });
  }
}
