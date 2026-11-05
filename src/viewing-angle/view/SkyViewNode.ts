/**
 * SkyViewNode.ts
 *
 * The orbit as it would look from Earth if we could see it: projected onto the
 * sky, perpendicular to our line of sight. Edge-on it is a straight line (all
 * the star's motion is toward and away from us); face-on it is a circle (all of
 * it is across the sky, and there is no Doppler shift at all).
 *
 * The horizontal axis is the line of nodes, where the orbit crosses the sky
 * plane, so the orbit's long axis stays horizontal while the tilt changes.
 */

import { Multilink } from "scenerystack/axon";
import { Vector2, Vector3 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Circle, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import type { OrbitalSystem } from "../../common/model/OrbitalSystem.js";
import { directionToEarth } from "../../common/model/orbitPhysics.js";
import { shiftMagnification } from "../../common/model/stellarSpectrum.js";
import { StarNode } from "../../common/view/StarNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import { FONTS } from "../../StellarWobbleConstants.js";

const DEG = Math.PI / 180;
const ORBIT_SAMPLES = 72;

export class SkyViewNode extends Node {
  public constructor(system: OrbitalSystem, size: number) {
    super();
    const strings = StringManager.getInstance().getViewingAngleStrings();
    const center = new Vector2(size / 2, size / 2 + 8);
    const orbitRadius = size * 0.38;
    const maxStarRadius = size * 0.09;

    const background = new Rectangle(0, 0, size, size, {
      fill: StellarWobbleColors.spaceColorProperty,
      stroke: StellarWobbleColors.spaceBorderColorProperty,
    });
    const title = new Text(strings.skyViewTitleStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.textColorProperty,
      maxWidth: size - 12,
      left: 6,
      top: 4,
    });
    const planetOrbit = new Path(null, { stroke: StellarWobbleColors.orbitPathColorProperty, lineDash: [3, 3] });
    const starOrbit = new Path(null, { stroke: StellarWobbleColors.starOrbitPathColorProperty, lineDash: [2, 2] });
    const planet = new Circle(4, { fill: StellarWobbleColors.planetColorProperty, opacity: 0.6 });
    const star = new StarNode(system.starMassProperty, 8);
    const bodies = new Node({ children: [planet, star] });

    const multilink = Multilink.multilinkAny(
      [
        system.phaseProperty,
        system.inclinationProperty,
        system.earthAzimuthProperty,
        system.starOrbitRadiusProperty,
        system.planetOrbitRadiusProperty,
      ],
      () => {
        const azimuth = system.earthAzimuthProperty.value * DEG;
        const toEarth = directionToEarth(system.inclinationProperty.value * DEG, azimuth);
        const across = new Vector3(-Math.sin(azimuth), Math.cos(azimuth), 0); // line of nodes
        const upOnSky = toEarth.cross(across);
        const project = (p: Vector3, depthOut?: { depth: number }): Vector2 => {
          if (depthOut) {
            depthOut.depth = p.dot(toEarth);
          }
          return center.plusXY(p.dot(across), -p.dot(upOnSky));
        };

        const ratio = system.starOrbitRadiusProperty.value / system.planetOrbitRadiusProperty.value;
        const starRadius = ratio * orbitRadius * shiftMagnification(ratio * orbitRadius, maxStarRadius);
        const ellipse = (radius: number): Shape => {
          const shape = new Shape();
          for (let i = 0; i <= ORBIT_SAMPLES; i++) {
            const angle = (2 * Math.PI * i) / ORBIT_SAMPLES;
            const point = project(new Vector3(radius * Math.cos(angle), radius * Math.sin(angle), 0));
            i === 0 ? shape.moveToPoint(point) : shape.lineToPoint(point);
          }
          return shape;
        };
        planetOrbit.shape = ellipse(orbitRadius);
        starOrbit.shape = ellipse(Math.max(starRadius, 0.5));

        const theta = 2 * Math.PI * system.phaseProperty.value;
        const planetDepth = { depth: 0 };
        const starDepth = { depth: 0 };
        planet.center = project(
          new Vector3(orbitRadius * Math.cos(theta), orbitRadius * Math.sin(theta), 0),
          planetDepth,
        );
        star.center = project(new Vector3(-starRadius * Math.cos(theta), -starRadius * Math.sin(theta), 0), starDepth);
        // Larger depth = closer to Earth: draw it in front.
        if (planetDepth.depth > starDepth.depth) {
          planet.moveToFront();
        } else {
          planet.moveToBack();
        }
      },
    );

    this.children = [background, planetOrbit, starOrbit, bodies, title];
    this.disposeEmitter.addListener(() => multilink.dispose());
  }
}
