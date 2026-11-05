/**
 * StellarWobblePanel.ts
 *
 * A pre-themed Panel that automatically uses StellarWobbleColors for background and
 * border. Use this for all control panels and info boxes in the sim so that
 * default / projector mode switching is handled automatically.
 *
 * ── Basic usage ───────────────────────────────────────────────────────────────
 *
 *   import { StellarWobblePanel } from "../../common/StellarWobblePanel.js";
 *   import { VBox, Text } from "scenerystack/scenery";
 *
 *   const content = new VBox({
 *     children: [ new Text("label"), slider ],
 *     spacing: 8,
 *   });
 *   const panel = new StellarWobblePanel(content);
 *
 * ── Overriding defaults ───────────────────────────────────────────────────────
 *
 *   // Wider margins, sharper corners, custom stroke
 *   const panel = new StellarWobblePanel(content, { xMargin: 20, cornerRadius: 0 });
 *
 *   // Transparent background (decorative border only)
 *   const panel = new StellarWobblePanel(content, { fill: "transparent" });
 */

import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { Node } from "scenerystack/scenery";
import { Panel, type PanelOptions } from "scenerystack/sun";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { PANEL_CORNER_RADIUS } from "../StellarWobbleConstants.js";

export type StellarWobblePanelOptions = PanelOptions;

export class StellarWobblePanel extends Panel {
  public constructor(content: Node, providedOptions?: StellarWobblePanelOptions) {
    const options = optionize<StellarWobblePanelOptions, EmptySelfOptions, PanelOptions>()(
      {
        fill: StellarWobbleColors.panelBackgroundColorProperty,
        stroke: StellarWobbleColors.panelBorderColorProperty,
        cornerRadius: PANEL_CORNER_RADIUS,
        xMargin: 12,
        yMargin: 10,
      },
      providedOptions,
    );
    super(content, options);
  }
}
