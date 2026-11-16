/**
 * orbitSchematic.ts
 *
 * Shared drawing helpers for the Wobble top view and the Viewing Angle 3-D
 * orbit: barycentre × mark, velocity / radial-component arrows, and the drawn
 * (magnified) star-orbit radius. Geometry is pure; Node factories are thin.
 */

import type { Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import type { TPaint } from "scenerystack/scenery";
import { Path } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { ORBIT_SCHEMATIC_SETTINGS } from "../../StellarWobbleConstants.js";
import { shiftMagnification } from "../model/stellarSpectrum.js";

/** Options shared by the star-velocity and radial-component ArrowNodes. */
export type VelocityArrowOptions = {
  readonly headHeight: number;
  readonly headWidth: number;
  readonly tailWidth: number;
  readonly lineWidth: number;
};

/** × mark centred on the origin (caller sets `center` when placing it). */
function barycenterCrossShape(halfExtent: number): Shape {
  return new Shape()
    .moveTo(-halfExtent, -halfExtent)
    .lineTo(halfExtent, halfExtent)
    .moveTo(-halfExtent, halfExtent)
    .lineTo(halfExtent, -halfExtent);
}

/** Barycentre × Path; optional `center` places it immediately. */
export function createBarycenterMarker(halfExtent: number, lineWidth: number, center?: Vector2): Path {
  return new Path(barycenterCrossShape(halfExtent), {
    stroke: StellarWobbleColors.barycenterColorProperty,
    lineWidth: lineWidth,
    ...(center !== undefined ? { center } : {}),
  });
}

/** Star velocity arrow plus its radial (line-of-sight) component. */
export function createVelocityArrows(options: VelocityArrowOptions): {
  velocityArrow: ArrowNode;
  radialArrow: ArrowNode;
} {
  const arrowOptions = {
    headHeight: options.headHeight,
    headWidth: options.headWidth,
    tailWidth: options.tailWidth,
    stroke: "black",
    lineWidth: options.lineWidth,
  };
  return {
    velocityArrow: new ArrowNode(0, 0, 1, 0, {
      ...arrowOptions,
      fill: StellarWobbleColors.velocityColorProperty,
    }),
    radialArrow: new ArrowNode(0, 0, 1, 0, arrowOptions),
  };
}

/**
 * Drawn radius of the star's own orbit after the labelled 1-2-5 magnification,
 * never smaller than half a pixel so the dashed path stays visible.
 */
export function drawnStarOrbitRadius(
  starToPlanetRadiusRatio: number,
  drawnPlanetOrbitRadius: number,
  maxStarOrbitRadius: number,
): number {
  const unmagnified = starToPlanetRadiusRatio * drawnPlanetOrbitRadius;
  return Math.max(unmagnified * shiftMagnification(unmagnified, maxStarOrbitRadius), 0.5);
}

/** Whether the radial-component arrow is long enough to draw. */
export function isRadialArrowVisible(drawnLengthPx: number): boolean {
  return drawnLengthPx > ORBIT_SCHEMATIC_SETTINGS.RADIAL_ARROW_MIN_LENGTH_PX;
}

/**
 * Fill for the radial-component arrow: red when the star is moving away from
 * the observer, blue when toward.
 */
export function radialComponentFill(awayFromObserver: boolean): TPaint {
  return awayFromObserver ? StellarWobbleColors.redshiftColorProperty : StellarWobbleColors.blueshiftColorProperty;
}
