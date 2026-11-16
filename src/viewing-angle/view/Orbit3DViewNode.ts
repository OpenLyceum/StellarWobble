import { ORBIT_3D_VIEW_NODE_SETTINGS } from "../../StellarWobbleConstants.js";
/**
 * Orbit3DViewNode.ts
 *
 * The orbit drawn in 3-D (orthographic projection, plain scenery Paths), seen
 * by a camera the user rotates by dragging or with the arrow keys. The orbit is
 * fixed; the "To Earth" arrow moves when the inclination or Earth's direction
 * changes, because what changes is where we stand.
 *
 * The star's velocity is drawn with its part along the line of sight to Earth
 * (red away, blue toward). Only that part shifts the star's spectral lines.
 *
 * Not to scale: the planet's orbit has a fixed drawn size and the star's own
 * orbit is magnified (as on the Wobble screen).
 */

import { Multilink, NumberProperty } from "scenerystack/axon";
import { Range, Vector2, Vector3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, DragListener, KeyboardListener, Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import type { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { directionToEarth, starVelocity } from "../../common/model/orbitPhysics.js";
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
import { FONTS } from "../../StellarWobbleConstants.js";

const DEG = Math.PI / 180;

/** Drawn planet-orbit radius, px. */
const PLANET_ORBIT_RADIUS: number = ORBIT_3D_VIEW_NODE_SETTINGS.PLANET_ORBIT_RADIUS;

/** Largest drawn radius of the star's own orbit, px. */
const MAX_STAR_ORBIT_RADIUS: number = ORBIT_3D_VIEW_NODE_SETTINGS.MAX_STAR_ORBIT_RADIUS;

/** Length of the Earth direction arrow, px. */
const EARTH_ARROW_LENGTH: number = ORBIT_3D_VIEW_NODE_SETTINGS.EARTH_ARROW_LENGTH;
/** Length of the star's velocity arrow, px. */
const VELOCITY_ARROW_LENGTH: number = ORBIT_3D_VIEW_NODE_SETTINGS.VELOCITY_ARROW_LENGTH;

const ORBIT_SAMPLES: number = ORBIT_3D_VIEW_NODE_SETTINGS.ORBIT_SAMPLES;

/** Camera elevation range above the orbital plane, degrees. */
const ELEVATION_RANGE = new Range(
  ORBIT_3D_VIEW_NODE_SETTINGS.ELEVATION_RANGE_MIN,
  ORBIT_3D_VIEW_NODE_SETTINGS.ELEVATION_RANGE_MAX,
);
const KEYBOARD_STEP_DEG: number = ORBIT_3D_VIEW_NODE_SETTINGS.KEYBOARD_STEP_DEG;
const DRAG_DEG_PER_PX: number = ORBIT_3D_VIEW_NODE_SETTINGS.DRAG_DEG_PER_PX;

const INITIAL_ELEVATION: number = ORBIT_3D_VIEW_NODE_SETTINGS.INITIAL_ELEVATION;
const INITIAL_AZIMUTH: number = ORBIT_3D_VIEW_NODE_SETTINGS.INITIAL_AZIMUTH;

/** Projected point: screen offset from the view centre (y down) and depth (toward the camera > 0). */
type Projected = { point: Vector2; depth: number };

export class Orbit3DViewNode extends Node {
  /** Camera elevation above the orbital plane, degrees. */
  public readonly cameraElevationProperty = new NumberProperty(INITIAL_ELEVATION, { range: ELEVATION_RANGE });

  /** Camera azimuth about the orbit normal, degrees. */
  public readonly cameraAzimuthProperty = new NumberProperty(INITIAL_AZIMUTH);

  public constructor(system: OrbitalSystem, width: number, height: number) {
    super();
    const strings = StringManager.getInstance().getViewingAngleStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getViewingAngleA11yStrings();
    const center = new Vector2(width / 2, height / 2 + 10);

    const background = new Rectangle(0, 0, width, height, {
      fill: StellarWobbleColors.spaceColorProperty,
      stroke: StellarWobbleColors.spaceBorderColorProperty,
      cursor: "grab",
    });
    const title = new Text(strings.view3DTitleStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: width - ORBIT_3D_VIEW_NODE_SETTINGS.TITLE_MAX_WIDTH_OFFSET,
      left: ORBIT_3D_VIEW_NODE_SETTINGS.TITLE_LEFT,
      top: ORBIT_3D_VIEW_NODE_SETTINGS.TITLE_TOP,
    });
    const notToScale = new Text(common.notToScaleStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.mutedTextColorProperty,
      maxWidth: width / 2,
      left: ORBIT_3D_VIEW_NODE_SETTINGS.NOT_TO_SCALE_LEFT,
      top: ORBIT_3D_VIEW_NODE_SETTINGS.NOT_TO_SCALE_TOP,
    });

    const planeFill = new Path(null, {
      fill: StellarWobbleColors.orbitPathColorProperty,
      opacity: ORBIT_3D_VIEW_NODE_SETTINGS.PLANE_FILL_OPACITY,
    });
    const planetOrbit = new Path(null, {
      stroke: StellarWobbleColors.orbitPathColorProperty,
      lineDash: [
        ORBIT_3D_VIEW_NODE_SETTINGS.PLANET_ORBIT_LINE_DASH_DASH,
        ORBIT_3D_VIEW_NODE_SETTINGS.PLANET_ORBIT_LINE_DASH_DASH,
      ],
    });
    const starOrbit = new Path(null, {
      stroke: StellarWobbleColors.starOrbitPathColorProperty,
      lineDash: [2, ORBIT_3D_VIEW_NODE_SETTINGS.STAR_ORBIT_LINE_DASH_DASH],
    });
    const normalLine = new Line(0, 0, 0, 0, {
      stroke: StellarWobbleColors.orbitPathColorProperty,
      lineDash: [1, ORBIT_3D_VIEW_NODE_SETTINGS.NORMAL_LINE_LINE_DASH_DASH],
    });
    const barycenter = createBarycenterMarker(
      Math.abs(ORBIT_3D_VIEW_NODE_SETTINGS.BARYCENTER_X),
      ORBIT_3D_VIEW_NODE_SETTINGS.BARYCENTER_LINE_WIDTH,
    );
    const star = new StarNode(system.starMassProperty, 13);
    const planet = new Circle(ORBIT_3D_VIEW_NODE_SETTINGS.PLANET_RADIUS, {
      fill: StellarWobbleColors.planetColorProperty,
      stroke: StellarWobbleColors.textColorProperty,
      lineWidth: ORBIT_3D_VIEW_NODE_SETTINGS.PLANET_LINE_WIDTH,
    });

    const earthArrow = new ArrowNode(0, 0, 1, 0, {
      fill: StellarWobbleColors.earthColorProperty,
      stroke: null,
      headHeight: ORBIT_3D_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_HEIGHT,
      headWidth: ORBIT_3D_VIEW_NODE_SETTINGS.EARTH_ARROW_HEAD_WIDTH,
      tailWidth: ORBIT_3D_VIEW_NODE_SETTINGS.EARTH_ARROW_TAIL_WIDTH,
    });
    const earthLabel = new Text(common.toEarthStringProperty, {
      font: FONTS.LABEL,
      fill: StellarWobbleColors.earthColorProperty,
      maxWidth: ORBIT_3D_VIEW_NODE_SETTINGS.EARTH_LABEL_MAX_WIDTH,
    });

    const { velocityArrow, radialArrow } = createVelocityArrows({
      headHeight: ORBIT_3D_VIEW_NODE_SETTINGS.ARROW_OPTIONS_HEAD_HEIGHT,
      headWidth: ORBIT_3D_VIEW_NODE_SETTINGS.ARROW_OPTIONS_HEAD_WIDTH,
      tailWidth: ORBIT_3D_VIEW_NODE_SETTINGS.ARROW_OPTIONS_TAIL_WIDTH,
      lineWidth: ORBIT_3D_VIEW_NODE_SETTINGS.ARROW_OPTIONS_LINE_WIDTH,
    });

    const bodies = new Node({ children: [planet, star] });
    const scene = new Node({
      children: [
        planeFill,
        normalLine,
        planetOrbit,
        starOrbit,
        earthArrow,
        earthLabel,
        bodies,
        barycenter,
        velocityArrow,
        radialArrow,
      ],
    });

    const update = (): void => {
      const elevation = this.cameraElevationProperty.value * DEG;
      const azimuth = this.cameraAzimuthProperty.value * DEG;
      const sinE = Math.sin(elevation);
      const cosE = Math.cos(elevation);
      const project = (p: Vector3): Projected => {
        // Rotate the camera azimuth away, then view from (0, −cos e, sin e).
        const c = Math.cos(-azimuth);
        const s = Math.sin(-azimuth);
        const x = p.x * c - p.y * s;
        const y = p.x * s + p.y * c;
        const up = y * sinE + p.z * cosE;
        return { point: center.plusXY(x, -up), depth: -y * cosE + p.z * sinE };
      };

      // Orbits and the orbital plane.
      const ratio = system.starOrbitRadiusProperty.value / system.planetOrbitRadiusProperty.value;
      const starRadius = drawnStarOrbitRadius(ratio, PLANET_ORBIT_RADIUS, MAX_STAR_ORBIT_RADIUS);
      const circle = (radius: number): Shape => {
        const shape = new Shape();
        for (let i = 0; i <= ORBIT_SAMPLES; i++) {
          const angle = (2 * Math.PI * i) / ORBIT_SAMPLES;
          const { point } = project(new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
          i === 0 ? shape.moveToPoint(point) : shape.lineToPoint(point);
        }
        return shape.close();
      };
      planeFill.shape = circle(PLANET_ORBIT_RADIUS * 1.15);
      planetOrbit.shape = circle(PLANET_ORBIT_RADIUS);
      starOrbit.shape = circle(starRadius);
      const normalTip = project(new Vector3(0, 0, 60)).point;
      normalLine.setLine(center.x, center.y, normalTip.x, normalTip.y);
      barycenter.center = center;

      // Bodies, drawn back to front.
      const theta = 2 * Math.PI * system.phaseProperty.value;
      const planetProjected = project(
        new Vector3(PLANET_ORBIT_RADIUS * Math.cos(theta), PLANET_ORBIT_RADIUS * Math.sin(theta), 0),
      );
      const starProjected = project(new Vector3(-starRadius * Math.cos(theta), -starRadius * Math.sin(theta), 0));
      planet.center = planetProjected.point;
      star.center = starProjected.point;
      if (planetProjected.depth < starProjected.depth) {
        planet.moveToBack();
      } else {
        planet.moveToFront();
      }

      // Earth.
      const toEarth = directionToEarth(system.inclinationProperty.value * DEG, system.earthAzimuthProperty.value * DEG);
      const earthTip = project(toEarth.timesScalar(EARTH_ARROW_LENGTH)).point;
      earthArrow.setTailAndTip(center.x, center.y, earthTip.x, earthTip.y);
      const outward = earthTip.minus(center);
      const labelOffset =
        outward.magnitude > 1
          ? outward.normalized().timesScalar(18)
          : new Vector2(0, ORBIT_3D_VIEW_NODE_SETTINGS.LABEL_OFFSET_Y);
      earthLabel.center = earthTip.plus(labelOffset);

      // Star velocity and its line-of-sight part.
      const velocity = starVelocity(system.phaseProperty.value, 1);
      const starTail = starProjected.point;
      const velocityTip = project(
        new Vector3(-starRadius * Math.cos(theta), -starRadius * Math.sin(theta), 0).plus(
          velocity.timesScalar(VELOCITY_ARROW_LENGTH),
        ),
      ).point;
      velocityArrow.setTailAndTip(starTail.x, starTail.y, velocityTip.x, velocityTip.y);
      const along = velocity.dot(toEarth); // > 0: toward Earth (blueshift)
      const radialVector = toEarth.timesScalar(along * VELOCITY_ARROW_LENGTH);
      const radialTip = project(
        new Vector3(-starRadius * Math.cos(theta), -starRadius * Math.sin(theta), 0).plus(radialVector),
      ).point;
      const radialVisible = isRadialArrowVisible(radialTip.distance(starTail));
      radialArrow.visible = radialVisible;
      if (radialVisible) {
        radialArrow.setTailAndTip(starTail.x, starTail.y, radialTip.x, radialTip.y);
      }
      // along > 0: toward Earth (blueshift) → awayFromObserver is false.
      radialArrow.fill = radialComponentFill(along <= 0);
    };

    const multilink = Multilink.multilinkAny(
      [
        this.cameraElevationProperty,
        this.cameraAzimuthProperty,
        system.phaseProperty,
        system.inclinationProperty,
        system.earthAzimuthProperty,
        system.starOrbitRadiusProperty,
        system.planetOrbitRadiusProperty,
      ],
      update,
    );

    // ── Rotate by dragging or with the arrow keys ─────────────────────────────────
    let previousPoint: Vector2 | null = null;
    background.addInputListener(
      new DragListener({
        start: (event) => {
          previousPoint = event.pointer.point.copy();
        },
        drag: (event) => {
          if (previousPoint) {
            const delta = event.pointer.point.minus(previousPoint);
            this.rotateCamera(-delta.x * DRAG_DEG_PER_PX, delta.y * DRAG_DEG_PER_PX);
          }
          previousPoint = event.pointer.point.copy();
        },
        end: () => {
          previousPoint = null;
        },
      }),
    );
    this.tagName = "div";
    this.focusable = true;
    this.accessibleName = a11y.controls.rotateViewStringProperty;
    this.addInputListener(
      new KeyboardListener({
        keys: ["arrowLeft", "arrowRight", "arrowUp", "arrowDown"],
        fireOnHold: true,
        fire: (_event, keysPressed) => {
          if (keysPressed === "arrowLeft") {
            this.rotateCamera(KEYBOARD_STEP_DEG, 0);
          } else if (keysPressed === "arrowRight") {
            this.rotateCamera(-KEYBOARD_STEP_DEG, 0);
          } else if (keysPressed === "arrowUp") {
            this.rotateCamera(0, KEYBOARD_STEP_DEG);
          } else {
            this.rotateCamera(0, -KEYBOARD_STEP_DEG);
          }
        },
      }),
    );

    this.children = [background, scene, title, notToScale];
    scene.clipArea = Shape.rect(0, 0, width, height);
    scene.pickable = false;

    this.disposeEmitter.addListener(() => multilink.dispose());
  }

  /** Rotates the camera by these angles, degrees (elevation is clamped). */
  public rotateCamera(azimuthDelta: number, elevationDelta: number): void {
    this.cameraAzimuthProperty.value = (this.cameraAzimuthProperty.value + azimuthDelta + 360) % 360;
    this.cameraElevationProperty.value = ELEVATION_RANGE.constrainValue(
      this.cameraElevationProperty.value + elevationDelta,
    );
  }

  /** Returns the camera to its initial position. */
  public resetCamera(): void {
    this.cameraElevationProperty.reset();
    this.cameraAzimuthProperty.reset();
  }
}
