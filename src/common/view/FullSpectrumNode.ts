/**
 * FullSpectrumNode.ts
 *
 * The visible spectrum of the star (380–700 nm) under the laboratory spectrum,
 * with a wavelength axis and labels for the main lines. Hβ and Hα are boxed:
 * those are the lines the zoom windows magnify.
 *
 * At this scale one pixel is about half a nanometre, so even a star moving at
 * 300 km/s shifts its lines by only a pixel or so. The full strip shows what
 * the lines are; the zoom windows show the shift.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Line, Node, type NodeOptions, Rectangle, Text } from "scenerystack/scenery";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  FONTS,
  FULL_SPECTRUM_LINE_SIGMA_NM,
  FULL_SPECTRUM_RANGE_NM,
  ZOOM_HALF_WIDTH_NM,
} from "../../StellarWobbleConstants.js";
import { H_ALPHA, H_BETA, spectrumIntensity } from "../model/stellarSpectrum.js";
import { SpectrumStripNode } from "./SpectrumStripNode.js";

/** Line labels drawn above the laboratory strip (wavelength, nm → label). */
const LINE_LABELS: readonly (readonly [number, string])[] = [
  [395.1, "Ca II"],
  [434.05, "Hγ"],
  [486.13, "Hβ"],
  [517.3, "Mg"],
  [589.3, "Na"],
  [656.28, "Hα"],
];

const LABEL_COLUMN = 36;
const TICK_SPACING_NM = 50;

export class FullSpectrumNode extends Node {
  private readonly starStrip: SpectrumStripNode;

  /**
   * @param radialVelocityProperty - the star's radial velocity, m/s (drawn to scale)
   * @param width - strip width, px
   */
  public constructor(radialVelocityProperty: TReadOnlyProperty<number>, width: number, options?: NodeOptions) {
    super();
    const common = StringManager.getInstance().getCommonStrings();
    const stripHeight = 18;
    const { min, max } = FULL_SPECTRUM_RANGE_NM;
    const xOf = (wavelength: number): number => LABEL_COLUMN + ((wavelength - min) / (max - min)) * width;

    const title = new Text(common.fullSpectrumTitleStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
      left: LABEL_COLUMN,
      top: 0,
    });

    const lineLabelTop = 20;
    const labTop = lineLabelTop + 14;
    const starTop = labTop + stripHeight + 3;

    const labStrip = new SpectrumStripNode(
      width,
      stripHeight,
      min,
      max,
      (wavelength) => spectrumIntensity(wavelength, 0, undefined, FULL_SPECTRUM_LINE_SIGMA_NM),
      [],
      { x: LABEL_COLUMN, y: labTop },
    );
    this.starStrip = new SpectrumStripNode(
      width,
      stripHeight,
      min,
      max,
      (wavelength) =>
        spectrumIntensity(wavelength, radialVelocityProperty.value, undefined, FULL_SPECTRUM_LINE_SIGMA_NM),
      [radialVelocityProperty],
      { x: LABEL_COLUMN, y: starTop },
    );
    const frameOptions = { stroke: StellarWobbleColors.spectrumFrameColorProperty, lineWidth: 1 };
    const labFrame = new Rectangle(LABEL_COLUMN, labTop, width, stripHeight, frameOptions);
    const starFrame = new Rectangle(LABEL_COLUMN, starTop, width, stripHeight, frameOptions);

    const labelOptions = {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: LABEL_COLUMN - 4,
    };
    const labLabel = new Text(common.labSpectrumStringProperty, labelOptions);
    const starLabel = new Text(common.starSpectrumStringProperty, labelOptions);
    labLabel.rightCenter = labFrame.leftCenter.plusXY(-4, 0);
    starLabel.rightCenter = starFrame.leftCenter.plusXY(-4, 0);

    const lineLabels = LINE_LABELS.map(
      ([wavelength, label]) =>
        new Text(label, {
          font: FONTS.SMALL,
          fill: StellarWobbleColors.mutedTextColorProperty,
          centerX: xOf(wavelength),
          bottom: labTop - 2,
        }),
    );

    // Boxes marking the zoomed lines.
    const zoomBoxes = [H_BETA, H_ALPHA].map((line) => {
      const boxWidth = Math.max(
        8,
        xOf(line.restWavelength + ZOOM_HALF_WIDTH_NM) - xOf(line.restWavelength - ZOOM_HALF_WIDTH_NM),
      );
      return new Rectangle(xOf(line.restWavelength) - boxWidth / 2, labTop - 2, boxWidth, 2 * stripHeight + 7, {
        stroke: StellarWobbleColors.profileColorProperty,
        lineWidth: 1.5,
      });
    });

    // Wavelength axis.
    const axisTop = starTop + stripHeight;
    const ticks: Node[] = [];
    for (
      let wavelength = Math.ceil(min / TICK_SPACING_NM) * TICK_SPACING_NM;
      wavelength <= max;
      wavelength += TICK_SPACING_NM
    ) {
      const x = xOf(wavelength);
      ticks.push(new Line(x, axisTop, x, axisTop + 4, { stroke: StellarWobbleColors.spectrumFrameColorProperty }));
      ticks.push(
        new Text(String(wavelength), {
          font: FONTS.SMALL,
          fill: StellarWobbleColors.mutedTextColorProperty,
          centerX: x,
          top: axisTop + 5,
        }),
      );
    }
    const axisLabel = new Text(common.wavelengthAxisStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width / 2,
    });
    axisLabel.boundsProperty.link(() => {
      axisLabel.centerX = LABEL_COLUMN + width / 2;
      axisLabel.top = axisTop + 19;
    });

    this.children = [
      title,
      ...lineLabels,
      labStrip,
      this.starStrip,
      labFrame,
      starFrame,
      labLabel,
      starLabel,
      ...zoomBoxes,
      ...ticks,
      axisLabel,
    ];
    if (options) {
      this.mutate(options);
    }
  }

  public override dispose(): void {
    this.starStrip.dispose();
    super.dispose();
  }
}
