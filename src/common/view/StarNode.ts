/**
 * StarNode.ts
 *
 * A glowing star disc whose colour follows the star's temperature. The radius
 * is a display radius in pixels (stars are never drawn to scale here).
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { Circle, Color, Node, type NodeOptions, RadialGradient } from "scenerystack/scenery";
import { blackbodyColor, starTemperature } from "../model/starAppearance.js";

export class StarNode extends Node {
  private readonly disposeStarNode: () => void;

  /**
   * @param starMassProperty - star mass, solar masses (sets the colour); a fixed number for a fixed star
   * @param radius - display radius, px
   */
  public constructor(starMassProperty: TReadOnlyProperty<number> | number, radius: number, options?: NodeOptions) {
    const glow = new Circle(radius * 1.9);
    // A thin darker rim keeps the pale disc visible on the light projector background.
    const disc = new Circle(radius, { lineWidth: radius * 0.08 });
    super({ children: [glow, disc], ...options });

    const update = (mass: number): void => {
      const color = blackbodyColor(starTemperature(mass));
      disc.fill = new RadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius)
        .addColorStop(0, Color.WHITE)
        .addColorStop(0.45, color.colorUtilsBrighter(0.25))
        .addColorStop(1, color);
      disc.stroke = color.colorUtilsDarker(0.4);
      glow.fill = new RadialGradient(0, 0, radius * 0.8, 0, 0, radius * 1.9)
        .addColorStop(0, color.withAlpha(0.45))
        .addColorStop(1, color.withAlpha(0));
    };

    if (typeof starMassProperty === "number") {
      update(starMassProperty);
      this.disposeStarNode = () => undefined;
    } else {
      starMassProperty.link(update);
      this.disposeStarNode = () => starMassProperty.unlink(update);
    }
  }

  public override dispose(): void {
    this.disposeStarNode();
    super.dispose();
  }
}
