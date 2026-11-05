/**
 * WaveViewNode.ts
 *
 * The Doppler screen's picture of a moving star sending light waves toward
 * Earth (at the bottom). The camera follows the star, so the star stays in the
 * middle while the background stars drift past; each wavefront is a circle
 * centred where the star was when it was emitted. Ahead of the star the
 * wavefronts bunch up (shorter wavelength, blueshift), behind it they spread
 * out (longer wavelength, redshift).
 *
 * The picture is NOT to scale: real stars move at a tiny fraction of the speed
 * of light, so the star's drawn speed is exaggerated (see MAX_DISPLAY_BETA).
 * Arrows show the star's velocity and, optionally, its radial (along the line
 * of sight) and sideways parts.
 */

import { BooleanProperty, Multilink } from "scenerystack/axon";
import { Bounds2, dotRandom, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  FONTS,
  MAX_STAR_DISPLAY_SPEED,
  WAVE_DISPLAY_SPEED,
  WAVE_EMISSION_PERIOD,
} from "../../StellarWobbleConstants.js";
import type { DopplerModel } from "../model/DopplerModel.js";

/** Length of a velocity arrow at the maximum slider value, px. */
const MAX_ARROW_LENGTH = 110;
const BACKGROUND_STAR_COUNT = 70;
const STAR_RADIUS = 16;

type Wavefront = { center: Vector2; age: number };

export class WaveViewNode extends Node {
  /** Whether wavefronts are drawn. */
  public readonly showWavesProperty = new BooleanProperty(true);

  /** Whether the radial and sideways parts of the velocity are drawn. */
  public readonly showComponentsProperty = new BooleanProperty(true);

  private readonly model: DopplerModel;
  private readonly viewBounds: Bounds2;
  private readonly starCenter: Vector2;
  private readonly wavefronts: Wavefront[] = [];
  private readonly wavesPath: Path;
  private readonly backgroundPath: Path;
  private readonly backgroundStars: Vector2[];

  /** Star position in the (unbounded) drawn world, px; the camera follows it. */
  private starWorldPosition = Vector2.ZERO;
  private timeSinceEmission = 0;

  public constructor(model: DopplerModel, width: number, height: number) {
    super();
    this.model = model;
    this.viewBounds = new Bounds2(0, 0, width, height);
    this.starCenter = new Vector2(width / 2, height * 0.42);
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getDopplerStrings();

    const background = new Rectangle(this.viewBounds, {
      fill: StellarWobbleColors.spaceColorProperty,
      stroke: StellarWobbleColors.spaceBorderColorProperty,
    });

    // Fixed random field of background stars, tiled as the camera moves.
    this.backgroundStars = Array.from(
      { length: BACKGROUND_STAR_COUNT },
      () => new Vector2(dotRandom.nextDouble() * width, dotRandom.nextDouble() * height),
    );
    this.backgroundPath = new Path(null, { fill: StellarWobbleColors.backgroundStarColorProperty });

    this.wavesPath = new Path(null, {
      stroke: StellarWobbleColors.wavefrontColorProperty,
      lineWidth: 1.5,
      visibleProperty: this.showWavesProperty,
    });

    const star = new StarNode(1, STAR_RADIUS, { center: this.starCenter });

    // ── Earth, far away below ────────────────────────────────────────────────────
    const earthArrow = new ArrowNode(width / 2, height - 46, width / 2, height - 14, {
      fill: StellarWobbleColors.earthColorProperty,
      stroke: null,
      headHeight: 10,
      headWidth: 14,
      tailWidth: 4,
    });
    const earthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.earthColorProperty,
      maxWidth: 120,
    });
    earthLabel.boundsProperty.link(() => {
      earthLabel.left = width / 2 + 10;
      earthLabel.centerY = height - 28;
    });
    const lineOfSight = new Line(this.starCenter.x, this.starCenter.y, width / 2, height - 46, {
      stroke: StellarWobbleColors.earthColorProperty,
      lineDash: [2, 5],
      lineWidth: 1,
    });

    const note = new Text(strings.waveNoteStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width - 16,
      left: 8,
      top: 6,
    });

    // ── Velocity arrows ──────────────────────────────────────────────────────────
    const arrowOptions = { headHeight: 12, headWidth: 14, tailWidth: 4, stroke: "black", lineWidth: 0.5 };
    const velocityArrow = new ArrowNode(0, 0, 1, 0, {
      ...arrowOptions,
      fill: StellarWobbleColors.velocityColorProperty,
    });
    const radialArrow = new ArrowNode(0, 0, 1, 0, arrowOptions);
    const sidewaysArrow = new ArrowNode(0, 0, 1, 0, {
      ...arrowOptions,
      fill: StellarWobbleColors.transverseColorProperty,
    });
    const componentArrows = new Node({
      children: [radialArrow, sidewaysArrow],
      visibleProperty: this.showComponentsProperty,
    });

    const arrowMultilink = Multilink.multilink([model.velocityFractionProperty], (fraction) => {
      // Screen y points down, toward Earth: moving away (positive radial) is up.
      const tip = this.starCenter.plusXY(fraction.x * MAX_ARROW_LENGTH, -fraction.y * MAX_ARROW_LENGTH);
      const setArrow = (arrow: ArrowNode, to: Vector2): void => {
        const visible = to.distance(this.starCenter) > 4;
        arrow.visible = visible;
        if (visible) {
          arrow.setTailAndTip(this.starCenter.x, this.starCenter.y, to.x, to.y);
        }
      };
      setArrow(velocityArrow, tip);
      setArrow(radialArrow, new Vector2(this.starCenter.x, tip.y));
      setArrow(sidewaysArrow, new Vector2(tip.x, this.starCenter.y));
      radialArrow.fill =
        fraction.y >= 0 ? StellarWobbleColors.redshiftColorProperty : StellarWobbleColors.blueshiftColorProperty;
    });

    const scene = new Node({
      children: [this.backgroundPath, lineOfSight, this.wavesPath, star, componentArrows, velocityArrow],
      clipArea: Shape.bounds(this.viewBounds),
    });

    this.children = [background, scene, earthArrow, earthLabel, note];

    this.disposeEmitter.addListener(() => arrowMultilink.dispose());
    this.redraw();
  }

  /** Clears the wavefronts (Reset All). */
  public reset(): void {
    this.wavefronts.length = 0;
    this.starWorldPosition = Vector2.ZERO;
    this.timeSinceEmission = 0;
    this.showWavesProperty.reset();
    this.showComponentsProperty.reset();
    this.redraw();
  }

  /** Advances the animation by dt seconds while the clock is running. */
  public step(dt: number): void {
    if (this.model.timer.isPlayingProperty.value) {
      this.advance(dt);
    }
  }

  /** Advances the animation by dt seconds (also used by the step button while paused). */
  public advance(dt: number): void {
    const fraction = this.model.velocityFractionProperty.value;
    const velocity = new Vector2(fraction.x, -fraction.y).timesScalar(MAX_STAR_DISPLAY_SPEED);
    this.starWorldPosition = this.starWorldPosition.plus(velocity.timesScalar(dt));

    for (const wavefront of this.wavefronts) {
      wavefront.age += dt;
    }
    this.timeSinceEmission += dt;
    while (this.timeSinceEmission >= WAVE_EMISSION_PERIOD) {
      this.timeSinceEmission -= WAVE_EMISSION_PERIOD;
      // Emitted a little in the past: place it where the star was then.
      const age = this.timeSinceEmission;
      this.wavefronts.push({ center: this.starWorldPosition.minus(velocity.timesScalar(age)), age: age });
    }
    const maxRadius = this.viewBounds.width * 1.3;
    while (this.wavefronts.length > 0 && (this.wavefronts[0]?.age ?? 0) * WAVE_DISPLAY_SPEED > maxRadius) {
      this.wavefronts.shift();
    }
    this.redraw();
  }

  private redraw(): void {
    const { width, height } = this.viewBounds;
    const offset = this.starCenter.minus(this.starWorldPosition);

    const waves = new Shape();
    for (const wavefront of this.wavefronts) {
      const center = wavefront.center.plus(offset);
      waves.circle(center.x, center.y, wavefront.age * WAVE_DISPLAY_SPEED);
      waves.newSubpath();
    }
    this.wavesPath.shape = waves;

    // Background stars drift opposite the star's motion (the camera follows the star).
    const stars = new Shape();
    for (const point of this.backgroundStars) {
      const x = (((point.x - this.starWorldPosition.x * 0.5) % width) + width) % width;
      const y = (((point.y - this.starWorldPosition.y * 0.5) % height) + height) % height;
      stars.circle(x, y, 1);
      stars.newSubpath();
    }
    this.backgroundPath.shape = stars;
  }
}
