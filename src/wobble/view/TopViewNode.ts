/**
 * TopViewNode.ts
 *
 * The Wobble screen's view from above the orbital plane: the planet and the
 * star circling their centre of mass (×), with Earth far away toward the
 * bottom. Nothing here is to scale:
 *
 *  - The planet's orbit radius grows with the logarithm of the distance, so
 *    every distance on the slider fits.
 *  - The star's own orbit is tiny (for Jupiter, about the Sun's radius), so it
 *    is magnified by a labelled 1-2-5 factor.
 *
 * In telescope view the planet, the orbits and the centre of mass disappear
 * and the star sits still: from Earth, the planet is invisible, and the star's
 * motion is far too small to see on the sky. Only its spectrum gives it away.
 */

import { BooleanProperty, DerivedProperty, Multilink, PatternStringProperty } from "scenerystack/axon";
import { dotRandom, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle, RichText, Text } from "scenerystack/scenery";
import { ArrowNode, PhetFont } from "scenerystack/scenery-phet";
import type { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { starRadiusSolar } from "../../common/model/starAppearance.js";
import { shiftMagnification } from "../../common/model/stellarSpectrum.js";
import { formatGrouped } from "../../common/view/chartUtils.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { DISTANCE_RANGE, FONTS, PLANET_MASS_RANGE } from "../../StellarWobbleConstants.js";

/** Drawn planet-orbit radius at the smallest and largest distance, px. */
const MIN_ORBIT_RADIUS = 55;
const MAX_ORBIT_RADIUS = 140;

/** Largest drawn radius of the star's own orbit, px. */
const MAX_STAR_ORBIT_RADIUS = 42;

/** Length of the star's velocity arrow, px. */
const VELOCITY_ARROW_LENGTH = 55;

const BACKGROUND_STAR_COUNT = 45;

export class TopViewNode extends Node {
  /** Whether the star's velocity arrows are shown. */
  public readonly showVelocityProperty = new BooleanProperty(true);

  /** Telescope view: hide everything the telescope cannot see. */
  public readonly telescopeViewProperty = new BooleanProperty(false);

  public constructor(system: OrbitalSystem, size: number) {
    super();
    const common = StringManager.getInstance().getCommonStrings();
    const strings = StringManager.getInstance().getWobbleStrings();
    const center = new Vector2(size / 2, size / 2 - 12);

    const background = new Rectangle(0, 0, size, size, {
      fill: StellarWobbleColors.spaceColorProperty,
      stroke: StellarWobbleColors.spaceBorderColorProperty,
    });
    const starField = new Shape();
    for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
      starField.circle(dotRandom.nextDouble() * size, dotRandom.nextDouble() * size, 0.9);
      starField.newSubpath();
    }
    const backgroundStars = new Path(starField, { fill: StellarWobbleColors.backgroundStarColorProperty });

    const title = new Text(strings.topViewTitleStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: size - 16,
      left: 8,
      top: 6,
    });

    // ── Scale ────────────────────────────────────────────────────────────────────
    const planetOrbitRadiusProperty = new DerivedProperty([system.distanceProperty], (distance) => {
      const fraction = Math.log(distance / DISTANCE_RANGE.min) / Math.log(DISTANCE_RANGE.max / DISTANCE_RANGE.min);
      return MIN_ORBIT_RADIUS + fraction * (MAX_ORBIT_RADIUS - MIN_ORBIT_RADIUS);
    });
    /** Star orbit radius / planet orbit radius (= Mp / M★). */
    const radiusRatioProperty = new DerivedProperty(
      [system.starOrbitRadiusProperty, system.planetOrbitRadiusProperty],
      (starRadius, planetRadius) => starRadius / planetRadius,
    );
    const magnificationProperty = new DerivedProperty(
      [radiusRatioProperty, planetOrbitRadiusProperty],
      (ratio, planetRadius) => shiftMagnification(ratio * planetRadius, MAX_STAR_ORBIT_RADIUS),
    );
    const starOrbitRadiusProperty = new DerivedProperty(
      [radiusRatioProperty, planetOrbitRadiusProperty, magnificationProperty],
      (ratio, planetRadius, magnification) => ratio * planetRadius * magnification,
    );

    // ── Orbits and bodies ────────────────────────────────────────────────────────
    const planetOrbit = new Circle(1, {
      center: center,
      stroke: StellarWobbleColors.orbitPathColorProperty,
      lineDash: [4, 4],
    });
    const starOrbit = new Circle(1, {
      center: center,
      stroke: StellarWobbleColors.starOrbitPathColorProperty,
      lineDash: [2, 3],
    });
    const barycenter = new Path(new Shape().moveTo(-6, -6).lineTo(6, 6).moveTo(-6, 6).lineTo(6, -6), {
      stroke: StellarWobbleColors.barycenterColorProperty,
      lineWidth: 2.5,
      center: center,
    });
    const barycenterLabel = new Text(common.barycenterStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.barycenterColorProperty,
      maxWidth: 100,
    });
    const star = new StarNode(system.starMassProperty, 1);
    const starScaleMultilink = Multilink.multilink([system.starMassProperty], (mass) => {
      star.setScaleMagnitude(14 * starRadiusSolar(mass));
    });
    const planet = new Circle(5, {
      fill: StellarWobbleColors.planetColorProperty,
      stroke: StellarWobbleColors.textColorProperty,
      lineWidth: 0.5,
    });
    const planetSizeMultilink = Multilink.multilink([system.planetMassProperty], (mass) => {
      const fraction = Math.log(mass / PLANET_MASS_RANGE.min) / Math.log(PLANET_MASS_RANGE.max / PLANET_MASS_RANGE.min);
      planet.radius = 3 + 6 * fraction;
    });

    // ── Velocity arrows ──────────────────────────────────────────────────────────
    const arrowOptions = { headHeight: 10, headWidth: 12, tailWidth: 3.5, stroke: "black", lineWidth: 0.5 };
    const velocityArrow = new ArrowNode(0, 0, 1, 0, {
      ...arrowOptions,
      fill: StellarWobbleColors.velocityColorProperty,
    });
    const radialArrow = new ArrowNode(0, 0, 1, 0, arrowOptions);
    const arrows = new Node({ children: [radialArrow, velocityArrow], visibleProperty: this.showVelocityProperty });

    // ── Earth ────────────────────────────────────────────────────────────────────
    const earthArrow = new ArrowNode(center.x, size - 40, center.x, size - 10, {
      fill: StellarWobbleColors.earthColorProperty,
      stroke: null,
      headHeight: 10,
      headWidth: 14,
      tailWidth: 4,
    });
    const earthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.earthColorProperty,
      maxWidth: 100,
    });
    earthLabel.boundsProperty.link(() => {
      earthLabel.left = center.x + 10;
      earthLabel.centerY = size - 24;
    });

    // ── Labels ───────────────────────────────────────────────────────────────────
    const magnificationStringProperty = new PatternStringProperty(strings.starMotionMagnifiedPatternStringProperty, {
      factor: new DerivedProperty([magnificationProperty], (magnification) => formatGrouped(magnification)),
    });
    const notToScale = new Text(common.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: size / 2,
      left: 8,
      top: 26,
    });
    const magnificationText = new Text(magnificationStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.starOrbitPathColorProperty,
      maxWidth: size - 16,
      left: 8,
      top: 41,
    });

    const caption = new RichText(strings.telescopeCaptionStringProperty, {
      font: new PhetFont(13),
      fill: StellarWobbleColors.textColorProperty,
      lineWrap: size - 40,
      align: "center",
    });
    const captionBox = new Node({ children: [caption] });
    caption.boundsProperty.link(() => {
      caption.centerX = size / 2;
      caption.bottom = size - 48;
    });

    const orbitalLayer = new Node({
      children: [planetOrbit, starOrbit, planet, magnificationText],
    });

    const updateMultilink = Multilink.multilink(
      [
        system.phaseProperty,
        planetOrbitRadiusProperty,
        starOrbitRadiusProperty,
        this.telescopeViewProperty,
        system.radialVelocityProperty,
      ],
      (phase, planetRadius, starRadius, telescopeView, radialVelocity) => {
        const theta = 2 * Math.PI * phase;
        // Model y points up; screen y points down.
        const direction = new Vector2(Math.cos(theta), -Math.sin(theta));
        planetOrbit.radius = planetRadius;
        starOrbit.radius = Math.max(starRadius, 0.5);
        planet.center = center.plus(direction.timesScalar(planetRadius));
        const starCenter = telescopeView ? center : center.minus(direction.timesScalar(starRadius));
        star.center = starCenter;
        // Keep the label on the side of the centre of mass away from the star.
        barycenterLabel.centerX = center.x;
        if (direction.y < 0) {
          barycenterLabel.bottom = center.y - 8;
        } else {
          barycenterLabel.top = center.y + 8;
        }

        // Star velocity (counter-clockwise), and its part along the line of sight (vertical).
        const velocity = new Vector2(Math.sin(theta), Math.cos(theta)).timesScalar(VELOCITY_ARROW_LENGTH);
        velocityArrow.setTailAndTip(starCenter.x, starCenter.y, starCenter.x + velocity.x, starCenter.y + velocity.y);
        // The telescope measures only the radial part (through the Doppler shift).
        velocityArrow.visible = !telescopeView;
        const radialVisible = Math.abs(velocity.y) > 3;
        radialArrow.visible = radialVisible;
        if (radialVisible) {
          radialArrow.setTailAndTip(starCenter.x, starCenter.y, starCenter.x, starCenter.y + velocity.y);
        }
        radialArrow.fill =
          radialVelocity > 0 ? StellarWobbleColors.redshiftColorProperty : StellarWobbleColors.blueshiftColorProperty;
      },
    );

    // The centre of mass is drawn over the star: it is often inside the star.
    const barycenterLayer = new Node({ children: [barycenter, barycenterLabel] });
    orbitalLayer.visibleProperty = DerivedProperty.not(this.telescopeViewProperty);
    barycenterLayer.visibleProperty = orbitalLayer.visibleProperty;
    captionBox.visibleProperty = this.telescopeViewProperty;

    const lineOfSight = new Line(center.x, center.y, center.x, size - 40, {
      stroke: StellarWobbleColors.earthColorProperty,
      lineDash: [2, 5],
    });

    this.children = [
      background,
      backgroundStars,
      lineOfSight,
      orbitalLayer,
      star,
      barycenterLayer,
      arrows,
      earthArrow,
      earthLabel,
      title,
      notToScale,
      captionBox,
    ];

    this.disposeEmitter.addListener(() => {
      updateMultilink.dispose();
      starScaleMultilink.dispose();
      planetSizeMultilink.dispose();
    });
  }

  public reset(): void {
    this.showVelocityProperty.reset();
    this.telescopeViewProperty.reset();
  }
}
