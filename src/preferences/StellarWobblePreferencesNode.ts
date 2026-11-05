/**
 * StellarWobblePreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to StellarWobblePreferencesModel Properties (whose initial values come from
 * stellarWobbleQueryParameters).
 */

import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../i18n/StringManager.js";
import StellarWobbleColors from "../StellarWobbleColors.js";
import StellarWobbleNamespace from "../StellarWobbleNamespace.js";
import type { StellarWobblePreferencesModel } from "./StellarWobblePreferencesModel.js";

export class StellarWobblePreferencesNode extends VBox {
  public constructor(preferencesModel: StellarWobblePreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: 18, weight: "bold" }),
      fill: StellarWobbleColors.controlSurfaceTextColorProperty,
    });

    const showEquationsCheckbox = new Checkbox(
      preferencesModel.showEquationsProperty,
      new Text(prefStrings.showEquationsStringProperty, {
        font: new PhetFont(14),
        fill: StellarWobbleColors.controlSurfaceTextColorProperty,
      }),
      {
        checkboxColor: StellarWobbleColors.controlSurfaceTextColorProperty,
        checkboxColorBackground: StellarWobbleColors.controlSurfaceColorProperty,
        spacing: 8,
        accessibleHelpText: prefStrings.showEquationsHelpStringProperty,
        ...(tandem && { tandem: tandem.createTandem("showEquationsCheckbox") }),
      },
    );

    const description = new Text(prefStrings.showEquationsHelpStringProperty, {
      font: new PhetFont(12),
      fill: StellarWobbleColors.controlSurfaceTextColorProperty,
      maxWidth: 420,
    });

    super({
      align: "left",
      spacing: 12,
      children: [header, showEquationsCheckbox, description],
    });
  }
}

StellarWobbleNamespace.register("StellarWobblePreferencesNode", StellarWobblePreferencesNode);
