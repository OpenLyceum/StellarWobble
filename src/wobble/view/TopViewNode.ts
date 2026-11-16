import { TOP_VIEW_NODE_SETTINGS } from "../../StellarWobbleConstants.js";
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
import {
  createBarycenterMarker,
  createVelocityArrows,
  drawnStarOrbitRadius,
  isRadialArrowVisible,
  radialComponentFill,
} from "../../common/view/orbitSchematic.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { DISTANCE_RANGE, FONTS, PLANET_MASS_RANGE } from "../../StellarWobbleConstants.js";

/** Drawn planet-orbit radius at the smallest and largest distance, px. */
const MIN_ORBIT_RADIUS: number = TOP_VIEW_NODE_SETTINGS.MIN_ORBIT_RADIUS;
const MAX_ORBIT_RADIUS: number = TOP_VIEW_NODE_SETTINGS.MAX_ORBIT_RADIUS;

/** Largest drawn radius of the star's own orbit, px. */
const MAX_STAR_ORBIT_RADIUS: number = TOP_VIEW_NODE_SETTINGS.MAX_STAR_ORBIT_RADIUS;

/** Length of the star's velocity arrow, px. */
const VELOCITY_ARROW_LENGTH: number = TOP_VIEW_NODE_SETTINGS.VELOCITY_ARROW_LENGTH;

const BACKGROUND_STAR_COUNT: number = TOP_VIEW_NODE_SETTINGS.BACKGROUND_STAR_COUNT;

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
      starField.circle(
        dotRandom.nextDouble() * size,
        dotRandom.nextDouble() * size,
        TOP_VIEW_NODE_SETTINGS.CIRCLE_RADIUS,
      );
      starField.newSubpath();
    }
    const backgroundStars = new Path(starField, { fill: StellarWobbleColors.backgroundStarColorProperty });

    const title = new Text(strings.topViewTitleStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: size - TOP_VIEW_NODE_SETTINGS.TITLE_MAX_WIDTH_OFFSET,
      left: TOP_VIEW_NODE_SETTINGS.TITLE_LEFT,
      top: TOP_VIEW_NODE_SETTINGS.TITLE_TOP,
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
      [radiusRatioProperty, planetOrbitRadiusProperty],
      (ratio, planetRadius) => drawnStarOrbitRadius(ratio, planetRadius, MAX_STAR_ORBIT_RADIUS),
    );

    // ── Orbits and bodies ────────────────────────────────────────────────────────
    const planetOrbit = new Circle(1, {
      center: center,
      stroke: StellarWobbleColors.orbitPathColorProperty,
      lineDash: [
        TOP_VIEW_NODE_SETTINGS.PLANET_ORBIT_LINE_DASH_DASH,
        TOP_VIEW_NODE_SETTINGS.PLANET_ORBIT_LINE_DASH_DASH,
      ],
    });
    const starOrbit = new Circle(1, {
      center: center,
      stroke: StellarWobbleColors.starOrbitPathColorProperty,
      lineDash: [2, TOP_VIEW_NODE_SETTINGS.STAR_ORBIT_LINE_DASH_DASH],
    });
    const barycenter = createBarycenterMarker(
      Math.abs(TOP_VIEW_NODE_SETTINGS.BARYCENTER_X),
      TOP_VIEW_NODE_SETTINGS.BARYCENTER_LINE_WIDTH,
      center,
    );
    const barycenterLabel = new Text(common.barycenterStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.barycenterColorProperty,
      maxWidth: TOP_VIEW_NODE_SETTINGS.BARYCENTER_LABEL_MAX_WIDTH,
    });
    const star = new StarNode(system.starMassProperty, 1);
    const starScaleMultilink = Multilink.multilink([system.starMassProperty], (mass) => {
      star.setScaleMagnitude(14 * starRadiusSolar(mass));
    });
    const planet = new Circle(TOP_VIEW_NODE_SETTINGS.PLANET_RADIUS, {
      fill: StellarWobbleColors.planetColorProperty,
      stroke: StellarWobbleColors.textColorProperty,
      lineWidth: TOP_VIEW_NODE_SETTINGS.PLANET_LINE_WIDTH,
    });
    const planetSizeMultilink = Multilink.multilink([system.planetMassProperty], (mass) => {
      const fraction = Math.log(mass / PLANET_MASS_RANGE.min) / Math.log(PLANET_MASS_RANGE.max / PLANET_MASS_RANGE.min);
      planet.radius =
        TOP_VIEW_NODE_SETTINGS.PLANET_SIZE_MULTILINK_RADIUS_OFFSET +
        TOP_VIEW_NODE_SETTINGS.PLANET_SIZE_MULTILINK_RADIUS_FACTOR * fraction;
    });

    // ── Velocity arrows ──────────────────────────────────────────────────────────
    const { velocityArrow, radialArrow } = createVelocityArrows({
      headHeight: TOP_VIEW_NODE_SETTINGS.ARROW_OPTIONS_HEAD_HEIGHT,
      headWidth: TOP_VIEW_NODE_SETTINGS.ARROW_OPTIONS_HEAD_WIDTH,
      tailWidth: TOP_VIEW_NODE_SETTINGS.ARROW_OPTIONS_TAIL_WIDTH,
      lineWidth: TOP_VIEW_NODE_SETTINGS.ARROW_OPTIONS_LINE_WIDTH,
    });
    const arrows = new Node({ children: [radialArrow, velocityArrow], visibleProperty: this.showVelocityProperty });

    // ── Earth ────────────────────────────────────────────────────────────────────
    const earthArrow = new ArrowNode(center.x, size - 40, center.x, size - 10, {
      fill: StellarWobbleColors.earthColorProperty,
      stroke: null,
      headHeight: TOP_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_HEIGHT,
      headWidth: TOP_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_WIDTH,
      tailWidth: TOP_VIEW_NODE_SETTINGS.EARTH_ARROW_TAIL_WIDTH,
    });
    const earthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.earthColorProperty,
      maxWidth: TOP_VIEW_NODE_SETTINGS.EARTH_LABEL_MAX_WIDTH,
    });
    earthLabel.boundsProperty.link(() => {
      earthLabel.left = center.x + TOP_VIEW_NODE_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
      earthLabel.centerY = size - TOP_VIEW_NODE_SETTINGS.CONSTRUCTOR_CENTER_Y_OFFSET;
    });

    // ── Labels ───────────────────────────────────────────────────────────────────
    const magnificationStringProperty = new PatternStringProperty(strings.starMotionMagnifiedPatternStringProperty, {
      factor: new DerivedProperty([magnificationProperty], (magnification) => formatGrouped(magnification)),
    });
    const notToScale = new Text(common.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: size / 2,
      left: TOP_VIEW_NODE_SETTINGS.NOT_TO_SCALE_LEFT,
      top: TOP_VIEW_NODE_SETTINGS.NOT_TO_SCALE_TOP,
    });
    const magnificationText = new Text(magnificationStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.starOrbitPathColorProperty,
      maxWidth: size - TOP_VIEW_NODE_SETTINGS.MAGNIFICATION_TEXT_MAX_WIDTH_OFFSET,
      left: TOP_VIEW_NODE_SETTINGS.MAGNIFICATION_TEXT_LEFT,
      top: TOP_VIEW_NODE_SETTINGS.MAGNIFICATION_TEXT_TOP,
    });

    const caption = new RichText(strings.telescopeCaptionStringProperty, {
      font: new PhetFont(TOP_VIEW_NODE_SETTINGS.CAPTION_FONT_SIZE),
      fill: StellarWobbleColors.textColorProperty,
      lineWrap: size - TOP_VIEW_NODE_SETTINGS.CAPTION_LINE_WRAP_OFFSET,
      align: "center",
    });
    const captionBox = new Node({ children: [caption] });
    caption.boundsProperty.link(() => {
      caption.centerX = size / 2;
      caption.bottom = size - TOP_VIEW_NODE_SETTINGS.CONSTRUCTOR_BOTTOM_OFFSET;
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
        starOrbit.radius = starRadius;
        planet.center = center.plus(direction.timesScalar(planetRadius));
        const starCenter = telescopeView ? center : center.minus(direction.timesScalar(starRadius));
        star.center = starCenter;
        // Keep the label on the side of the centre of mass away from the star.
        barycenterLabel.centerX = center.x;
        if (direction.y < 0) {
          barycenterLabel.bottom = center.y - TOP_VIEW_NODE_SETTINGS.UPDATE_MULTILINK_BOTTOM_OFFSET;
        } else {
          barycenterLabel.top = center.y + TOP_VIEW_NODE_SETTINGS.UPDATE_MULTILINK_TOP_OFFSET;
        }

        // Star velocity (counter-clockwise), and its part along the line of sight (vertical).
        const velocity = new Vector2(Math.sin(theta), Math.cos(theta)).timesScalar(VELOCITY_ARROW_LENGTH);
        velocityArrow.setTailAndTip(starCenter.x, starCenter.y, starCenter.x + velocity.x, starCenter.y + velocity.y);
        // The telescope measures only the radial part (through the Doppler shift).
        velocityArrow.visible = !telescopeView;
        const radialVisible = isRadialArrowVisible(Math.abs(velocity.y));
        radialArrow.visible = radialVisible;
        if (radialVisible) {
          radialArrow.setTailAndTip(starCenter.x, starCenter.y, starCenter.x, starCenter.y + velocity.y);
        }
        radialArrow.fill = radialComponentFill(radialVelocity > 0);
      },
    );

    // The centre of mass is drawn over the star: it is often inside the star.
    const barycenterLayer = new Node({ children: [barycenter, barycenterLabel] });
    orbitalLayer.visibleProperty = DerivedProperty.not(this.telescopeViewProperty);
    barycenterLayer.visibleProperty = orbitalLayer.visibleProperty;
    captionBox.visibleProperty = this.telescopeViewProperty;

    const lineOfSight = new Line(center.x, center.y, center.x, size - 40, {
      stroke: StellarWobbleColors.earthColorProperty,
      lineDash: [2, TOP_VIEW_NODE_SETTINGS.LINE_OF_SIGHT_LINE_DASH_DASH],
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
