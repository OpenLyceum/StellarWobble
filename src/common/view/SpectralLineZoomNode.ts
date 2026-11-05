/**
 * SpectralLineZoomNode.ts
 *
 * A window a couple of nanometres wide around one absorption line: the
 * laboratory strip, the star's strip, the line's intensity profile, a dashed
 * marker at the laboratory (rest) wavelength, and an arrow from the rest
 * position to the observed one labelled with the true shift Δλ.
 *
 * A planet's wobble shifts a line by ~10⁻⁵ nm, far less than a pixel, so the
 * drawn shift can be magnified by a power of ten. The magnification is always
 * printed under the window ("shift drawn ×10 000"); the Δλ label always gives
 * the real, unmagnified value.
 */

import { DerivedProperty, Multilink, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { Line, Node, type NodeOptions, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS, ZOOM_HALF_WIDTH_NM } from "../../StellarWobbleConstants.js";
import { type AbsorptionLine, dopplerShift, STELLAR_LINES, spectrumIntensity } from "../model/stellarSpectrum.js";
import { formatGrouped, formatSigned, formatTickValue } from "./chartUtils.js";
import { SpectrumStripNode } from "./SpectrumStripNode.js";

export type SpectralLineZoomNodeOptions = {
  /** Width of the strips, px. */
  width?: number;
  /** Height of each strip, px. */
  stripHeight?: number;
  /** Height of the profile plot, px. */
  profileHeight?: number;
  nodeOptions?: NodeOptions;
};

const LABEL_COLUMN = 34;
const GAP = 3;

export class SpectralLineZoomNode extends Node {
  private readonly disposeZoomNode: () => void;

  /**
   * @param line - the line to zoom on
   * @param radialVelocityProperty - the star's radial velocity, m/s
   * @param magnificationProperty - factor applied to the drawn shift (1 = to scale)
   */
  public constructor(
    line: AbsorptionLine,
    radialVelocityProperty: TReadOnlyProperty<number>,
    magnificationProperty: TReadOnlyProperty<number>,
    providedOptions?: SpectralLineZoomNodeOptions,
  ) {
    super();
    const width = providedOptions?.width ?? 220;
    const stripHeight = providedOptions?.stripHeight ?? 16;
    const profileHeight = providedOptions?.profileHeight ?? 46;
    const common = StringManager.getInstance().getCommonStrings();

    const minWavelength = line.restWavelength - ZOOM_HALF_WIDTH_NM;
    const maxWavelength = line.restWavelength + ZOOM_HALF_WIDTH_NM;
    const xOf = (wavelength: number): number =>
      LABEL_COLUMN + ((wavelength - minWavelength) / (maxWavelength - minWavelength)) * width;

    /** The radial velocity the drawing uses: the real one, magnified. */
    const drawnVelocityProperty = new DerivedProperty(
      [radialVelocityProperty, magnificationProperty],
      (velocity, magnification) => velocity * magnification,
    );

    const titleStringProperty = new PatternStringProperty(common.zoomTitlePatternStringProperty, {
      line: line.label,
    });
    const title = new Text(titleStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width + LABEL_COLUMN,
    });

    const labTop = 22;
    const starTop = labTop + stripHeight + GAP;
    const profileTop = starTop + stripHeight + 6;
    const profileBottom = profileTop + profileHeight;

    const labStrip = new SpectrumStripNode(
      width,
      stripHeight,
      minWavelength,
      maxWavelength,
      (wavelength) => spectrumIntensity(wavelength, 0),
      [],
      { x: LABEL_COLUMN, y: labTop },
    );
    const starStrip = new SpectrumStripNode(
      width,
      stripHeight,
      minWavelength,
      maxWavelength,
      (wavelength) => spectrumIntensity(wavelength, drawnVelocityProperty.value),
      [drawnVelocityProperty],
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

    // ── Profile plot (intensity vs wavelength) ──────────────────────────────────
    const profileFrame = new Rectangle(LABEL_COLUMN, profileTop, width, profileHeight, {
      stroke: StellarWobbleColors.spectrumFrameColorProperty,
      lineWidth: 0.5,
    });
    const profilePath = new Path(null, { stroke: StellarWobbleColors.profileColorProperty, lineWidth: 1.5 });
    const deepest = Math.max(...STELLAR_LINES.map((l) => l.depth));
    const yOf = (intensity: number): number => profileTop + 3 + ((1 - intensity) / deepest) * (profileHeight - 6);

    const restX = xOf(line.restWavelength);
    const restMarker = new Line(restX, labTop - 3, restX, profileBottom, {
      stroke: StellarWobbleColors.restMarkerColorProperty,
      lineDash: [3, 3],
      lineWidth: 1,
    });

    const arrowY = profileBottom + 9;
    const shiftArrow = new ArrowNode(0, 0, 1, 0, {
      headHeight: 7,
      headWidth: 8,
      tailWidth: 2,
      stroke: null,
    });
    shiftArrow.y = arrowY;

    // ── Tick labels and readouts ─────────────────────────────────────────────────
    const tickOptions = { font: FONTS.SMALL, fill: StellarWobbleColors.mutedTextColorProperty };
    const tickTop = arrowY + 7;
    const leftTick = new Text(formatTickValue(minWavelength, 2), tickOptions);
    const centerTick = new Text(formatTickValue(line.restWavelength, 2), tickOptions);
    const rightTick = new Text(formatTickValue(maxWavelength, 2), tickOptions);
    leftTick.left = LABEL_COLUMN;
    centerTick.centerX = restX;
    rightTick.right = LABEL_COLUMN + width;
    for (const tick of [leftTick, centerTick, rightTick]) {
      tick.top = tickTop;
    }

    const shiftValueProperty = new DerivedProperty([radialVelocityProperty], (velocity) =>
      formatSigned(dopplerShift(line.restWavelength, velocity), 2),
    );
    const shiftStringProperty = new PatternStringProperty(common.shiftPatternStringProperty, {
      value: shiftValueProperty,
    });
    const shiftText = new RichText(shiftStringProperty, {
      font: FONTS.READOUT,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width,
    });

    const magnifiedStringProperty = new PatternStringProperty(common.magnifiedPatternStringProperty, {
      factor: new DerivedProperty([magnificationProperty], (magnification) => formatGrouped(magnification)),
    });
    const magnificationTextProperty = new DerivedProperty(
      [magnificationProperty, magnifiedStringProperty, common.toScaleStringProperty],
      (magnification, magnified, toScale) => (magnification > 1 ? magnified : toScale),
    );
    const magnificationText = new Text(magnificationTextProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width,
    });

    const placeReadouts = (): void => {
      shiftText.centerX = LABEL_COLUMN + width / 2;
      shiftText.top = tickTop + 14;
      magnificationText.centerX = LABEL_COLUMN + width / 2;
      magnificationText.top = shiftText.bottom + 1;
    };
    shiftText.boundsProperty.link(placeReadouts);
    magnificationText.boundsProperty.link(placeReadouts);

    const updateMultilink = Multilink.multilink(
      [drawnVelocityProperty, radialVelocityProperty],
      (drawnVelocity, velocity) => {
        const shape = new Shape();
        const samples = Math.ceil(width / 2);
        for (let i = 0; i <= samples; i++) {
          const wavelength = minWavelength + (i / samples) * (maxWavelength - minWavelength);
          const point = [xOf(wavelength), yOf(spectrumIntensity(wavelength, drawnVelocity))] as const;
          i === 0 ? shape.moveTo(...point) : shape.lineTo(...point);
        }
        profilePath.shape = shape;

        const observedX = Math.min(
          LABEL_COLUMN + width,
          Math.max(LABEL_COLUMN, xOf(line.restWavelength + dopplerShift(line.restWavelength, drawnVelocity))),
        );
        const visible = Math.abs(observedX - restX) > 2;
        shiftArrow.visible = visible;
        if (visible) {
          shiftArrow.setTailAndTip(restX, 0, observedX, 0);
          shiftArrow.fill =
            velocity > 0 ? StellarWobbleColors.redshiftColorProperty : StellarWobbleColors.blueshiftColorProperty;
        }
      },
    );

    this.children = [
      title,
      labStrip,
      starStrip,
      labFrame,
      starFrame,
      labLabel,
      starLabel,
      profileFrame,
      profilePath,
      restMarker,
      shiftArrow,
      leftTick,
      centerTick,
      rightTick,
      shiftText,
      magnificationText,
    ];
    title.left = LABEL_COLUMN;
    title.bottom = labTop - 4;

    if (providedOptions?.nodeOptions) {
      this.mutate(providedOptions.nodeOptions);
    }

    this.disposeZoomNode = () => {
      updateMultilink.dispose();
      shiftText.boundsProperty.unlink(placeReadouts);
      magnificationText.boundsProperty.unlink(placeReadouts);
      magnificationText.dispose();
      magnificationTextProperty.dispose();
      magnifiedStringProperty.dispose();
      shiftText.dispose();
      shiftStringProperty.dispose();
      shiftValueProperty.dispose();
      title.dispose();
      titleStringProperty.dispose();
      starStrip.dispose();
      drawnVelocityProperty.dispose();
    };
  }

  public override dispose(): void {
    this.disposeZoomNode();
    super.dispose();
  }
}
