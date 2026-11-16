/**
 * StellarWobbleScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen, drawn on the
 * standard 548 × 373 canvas with StellarWobbleColors.
 *
 *  - Doppler: a star with bunched and stretched wavefronts over a spectrum strip.
 *  - Wobble: star and planet orbiting their centre of mass.
 *  - Viewing Angle: a tilted orbit and the arrow toward Earth.
 *  - Observatory: radial-velocity measurements with a fitted curve.
 */
import { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Line, LinearGradient, Node, Path, Rectangle } from "scenerystack/scenery";
import { ArrowNode, VisibleColor } from "scenerystack/scenery-phet";
import { ScreenIcon } from "scenerystack/sim";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS } from "../StellarWobbleConstants.js";
import { StarNode } from "./view/StarNode.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: StellarWobbleColors.spaceColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: StellarWobbleColors.spaceColorProperty,
  });
}

/** A rainbow strip with one dark absorption line at fraction `lineAt` of its width. */
function spectrumStrip(x: number, y: number, width: number, height: number, lineAt: number): Node {
  const gradient = new LinearGradient(x, 0, x + width, 0);
  for (let i = 0; i <= 10; i++) {
    gradient.addColorStop(i / 10, VisibleColor.wavelengthToColor(400 + 28 * i));
  }
  return new Node({
    children: [
      new Rectangle(x, y, width, height, { fill: gradient }),
      new Rectangle(x + lineAt * width - 5, y, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.SPECTRUM_STRIP_WIDTH, height, {
        fill: "rgba(0,0,0,0.85)",
      }),
    ],
  });
}

export function createDopplerIcon(): ScreenIcon {
  const star = new StarNode(1, 26, { center: new Vector2(W / 2, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_Y) });
  const waves = new Shape();
  // Star moving up: wavefronts bunch above it and spread out below.
  for (let i = 1; i <= 5; i++) {
    const radius = 40 * i;
    waves.circle(W / 2, 140 + 14 * i, radius);
    waves.newSubpath();
  }
  const wavePath = new Path(waves, {
    stroke: StellarWobbleColors.wavefrontColorProperty,
    lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.WAVE_PATH_LINE_WIDTH,
  });
  const motion = new ArrowNode(
    W / 2,
    STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.MOTION_START_Y,
    W / 2,
    STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.MOTION_END_Y,
    {
      fill: StellarWobbleColors.redshiftColorProperty,
      stroke: null,
      headHeight: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.MOTION_HEAD_HEIGHT,
      headWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.MOTION_HEAD_WIDTH,
      tailWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.MOTION_TAIL_WIDTH,
    },
  );
  const content = new Node({
    children: [
      background(),
      wavePath,
      star,
      motion,
      spectrumStrip(60, 300, W - 120, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CONTENT_HEIGHT, 0.62),
    ],
    clipArea: Shape.rect(0, 0, W, H),
  });
  return iconFrom(content);
}

export function createWobbleIcon(): ScreenIcon {
  const center = new Vector2(W / 2, H / 2);
  const planetOrbit = new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_ORBIT_RADIUS, {
    center: center,
    stroke: StellarWobbleColors.orbitPathColorProperty,
    lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_ORBIT_LINE_WIDTH,
    lineDash: [
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_ORBIT_LINE_DASH_DASH,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CREATE_WOBBLE_ICON_PLANET_ORBIT_LINE_DASH_DASH,
    ],
  });
  const starOrbit = new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_ORBIT_RADIUS, {
    center: center,
    stroke: StellarWobbleColors.starOrbitPathColorProperty,
    lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_ORBIT_LINE_WIDTH,
    lineDash: [
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_ORBIT_LINE_DASH_DASH,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_ORBIT_LINE_DASH_DASH,
    ],
  });
  const star = new StarNode(1, 34, { center: center.plusXY(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.STAR_X_OFFSET, 0) });
  const planet = new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_RADIUS, {
    fill: StellarWobbleColors.planetColorProperty,
    center: center.plusXY(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_X_OFFSET, 0),
  });
  const cross = new Path(
    new Shape()
      .moveTo(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_X, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_Y)
      .lineTo(
        STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_X_SEGMENT_2,
        STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_Y_SEGMENT_2,
      )
      .moveTo(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_X, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_X_MOVE_TO_Y)
      .lineTo(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_X_SEGMENT_2, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_Y),
    {
      stroke: StellarWobbleColors.barycenterColorProperty,
      lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CROSS_LINE_WIDTH,
      center: center,
    },
  );
  return iconFrom(new Node({ children: [background(), planetOrbit, starOrbit, star, planet, cross] }));
}

export function createViewingAngleIcon(): ScreenIcon {
  const center = new Vector2(W / 2 + 40, H / 2 + 20);
  const plane = new Path(
    Shape.ellipse(
      center.x,
      center.y,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANE_RADIUS_X,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANE_RADIUS_Y,
      0,
    ),
    {
      fill: StellarWobbleColors.orbitPathColorProperty,
      opacity: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANE_OPACITY,
    },
  );
  const orbit = new Path(
    Shape.ellipse(
      center.x,
      center.y,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.ORBIT_RADIUS_X,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.ORBIT_RADIUS_Y,
      0,
    ),
    {
      stroke: StellarWobbleColors.orbitPathColorProperty,
      lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.ORBIT_LINE_WIDTH,
      lineDash: [
        STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.ORBIT_LINE_DASH_DASH,
        STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.CREATE_VIEWING_ANGLE_ICON_ORBIT_LINE_DASH_DASH,
      ],
    },
  );
  const star = new StarNode(1, 28, { center: center });
  const planet = new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_RADIUS_SEGMENT_2, {
    fill: StellarWobbleColors.planetColorProperty,
    center: center.plusXY(
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_X_OFFSET_SEGMENT_2,
      STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.PLANET_Y_OFFSET,
    ),
  });
  const earthArrow = new ArrowNode(
    center.x,
    center.y,
    STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_ARROW_END_X,
    STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_ARROW_END_Y,
    {
      fill: StellarWobbleColors.earthColorProperty,
      stroke: null,
      headHeight: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_ARROW_HEAD_HEIGHT,
      headWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_ARROW_HEAD_WIDTH,
      tailWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_ARROW_TAIL_WIDTH,
    },
  );
  const earth = new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_RADIUS, {
    fill: StellarWobbleColors.earthColorProperty,
    center: new Vector2(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_X, STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.EARTH_Y),
  });
  return iconFrom(new Node({ children: [background(), plane, orbit, earthArrow, earth, star, planet] }));
}

export function createObservatoryIcon(): ScreenIcon {
  const left: number = STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.LEFT;
  const right = W - 40;
  const mid = H / 2;
  const amplitude = 110;
  const curve = new Shape();
  for (let i = 0; i <= 100; i++) {
    const x = left + ((right - left) * i) / 100;
    const y = mid - amplitude * Math.sin((2 * Math.PI * 1.6 * i) / 100);
    i === 0 ? curve.moveTo(x, y) : curve.lineTo(x, y);
  }
  const fit = new Path(curve, {
    stroke: StellarWobbleColors.fitCurveColorProperty,
    lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.FIT_LINE_WIDTH,
  });
  const axis = new Line(left, mid, right, mid, {
    stroke: StellarWobbleColors.chartAxisColorProperty,
    lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.AXIS_LINE_WIDTH,
  });
  const offsets = [12, -18, 9, -6, 15, -12, 4, -15, 10, -4, 14];
  const points = offsets.map((offset, i) => {
    const t = 0.04 + (0.92 * i) / (offsets.length - 1);
    const x = left + (right - left) * t;
    const y = mid - amplitude * Math.sin(2 * Math.PI * 1.6 * t) + offset;
    return new Node({
      children: [
        new Line(x, y - 22, x, y + 22, {
          stroke: StellarWobbleColors.measurementColorProperty,
          lineWidth: STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.POINTS_LINE_WIDTH,
        }),
        new Circle(STELLAR_WOBBLE_SCREEN_ICONS_SETTINGS.POINTS_RADIUS, {
          fill: StellarWobbleColors.measurementColorProperty,
          center: new Vector2(x, y),
        }),
      ],
    });
  });
  return iconFrom(new Node({ children: [background(), axis, fit, ...points] }));
}
