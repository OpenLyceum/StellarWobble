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
      new Rectangle(x + lineAt * width - 5, y, 10, height, { fill: "rgba(0,0,0,0.85)" }),
    ],
  });
}

export function createDopplerIcon(): ScreenIcon {
  const star = new StarNode(1, 26, { center: new Vector2(W / 2, 140) });
  const waves = new Shape();
  // Star moving up: wavefronts bunch above it and spread out below.
  for (let i = 1; i <= 5; i++) {
    const radius = 40 * i;
    waves.circle(W / 2, 140 + 14 * i, radius);
    waves.newSubpath();
  }
  const wavePath = new Path(waves, { stroke: StellarWobbleColors.wavefrontColorProperty, lineWidth: 5 });
  const motion = new ArrowNode(W / 2, 110, W / 2, 30, {
    fill: StellarWobbleColors.redshiftColorProperty,
    stroke: null,
    headHeight: 26,
    headWidth: 32,
    tailWidth: 10,
  });
  const content = new Node({
    children: [background(), wavePath, star, motion, spectrumStrip(60, 300, W - 120, 46, 0.62)],
    clipArea: Shape.rect(0, 0, W, H),
  });
  return iconFrom(content);
}

export function createWobbleIcon(): ScreenIcon {
  const center = new Vector2(W / 2, H / 2);
  const planetOrbit = new Circle(150, {
    center: center,
    stroke: StellarWobbleColors.orbitPathColorProperty,
    lineWidth: 4,
    lineDash: [12, 10],
  });
  const starOrbit = new Circle(30, {
    center: center,
    stroke: StellarWobbleColors.starOrbitPathColorProperty,
    lineWidth: 4,
    lineDash: [6, 6],
  });
  const star = new StarNode(1, 34, { center: center.plusXY(-30, 0) });
  const planet = new Circle(18, { fill: StellarWobbleColors.planetColorProperty, center: center.plusXY(150, 0) });
  const cross = new Path(new Shape().moveTo(-12, -12).lineTo(12, 12).moveTo(-12, 12).lineTo(12, -12), {
    stroke: StellarWobbleColors.barycenterColorProperty,
    lineWidth: 6,
    center: center,
  });
  return iconFrom(new Node({ children: [background(), planetOrbit, starOrbit, star, planet, cross] }));
}

export function createViewingAngleIcon(): ScreenIcon {
  const center = new Vector2(W / 2 + 40, H / 2 + 20);
  const plane = new Path(Shape.ellipse(center.x, center.y, 190, 60, 0), {
    fill: StellarWobbleColors.orbitPathColorProperty,
    opacity: 0.35,
  });
  const orbit = new Path(Shape.ellipse(center.x, center.y, 170, 52, 0), {
    stroke: StellarWobbleColors.orbitPathColorProperty,
    lineWidth: 4,
    lineDash: [12, 10],
  });
  const star = new StarNode(1, 28, { center: center });
  const planet = new Circle(16, { fill: StellarWobbleColors.planetColorProperty, center: center.plusXY(120, -37) });
  const earthArrow = new ArrowNode(center.x, center.y, 70, 55, {
    fill: StellarWobbleColors.earthColorProperty,
    stroke: null,
    headHeight: 34,
    headWidth: 40,
    tailWidth: 12,
  });
  const earth = new Circle(22, { fill: StellarWobbleColors.earthColorProperty, center: new Vector2(45, 35) });
  return iconFrom(new Node({ children: [background(), plane, orbit, earthArrow, earth, star, planet] }));
}

export function createObservatoryIcon(): ScreenIcon {
  const left = 50;
  const right = W - 40;
  const mid = H / 2;
  const amplitude = 110;
  const curve = new Shape();
  for (let i = 0; i <= 100; i++) {
    const x = left + ((right - left) * i) / 100;
    const y = mid - amplitude * Math.sin((2 * Math.PI * 1.6 * i) / 100);
    i === 0 ? curve.moveTo(x, y) : curve.lineTo(x, y);
  }
  const fit = new Path(curve, { stroke: StellarWobbleColors.fitCurveColorProperty, lineWidth: 7 });
  const axis = new Line(left, mid, right, mid, { stroke: StellarWobbleColors.chartAxisColorProperty, lineWidth: 3 });
  const offsets = [12, -18, 9, -6, 15, -12, 4, -15, 10, -4, 14];
  const points = offsets.map((offset, i) => {
    const t = 0.04 + (0.92 * i) / (offsets.length - 1);
    const x = left + (right - left) * t;
    const y = mid - amplitude * Math.sin(2 * Math.PI * 1.6 * t) + offset;
    return new Node({
      children: [
        new Line(x, y - 22, x, y + 22, { stroke: StellarWobbleColors.measurementColorProperty, lineWidth: 3 }),
        new Circle(10, { fill: StellarWobbleColors.measurementColorProperty, center: new Vector2(x, y) }),
      ],
    });
  });
  return iconFrom(new Node({ children: [background(), axis, fit, ...points] }));
}
