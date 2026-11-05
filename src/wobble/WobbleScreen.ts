/**
 * WobbleScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createWobbleIcon() in src/common/StellarWobbleScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createWobbleIcon } from "../common/StellarWobbleScreenIcons.js";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { WobbleModel } from "./model/WobbleModel.js";
import { WobbleKeyboardHelpContent } from "./view/WobbleKeyboardHelpContent.js";
import { WobbleScreenView } from "./view/WobbleScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type WobbleScreenOptions = ScreenOptions & { tandem: Tandem };

export class WobbleScreen extends Screen<WobbleModel, WobbleScreenView> {
  public constructor(options: WobbleScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new WobbleModel(),
      // View factory — receives the model instance
      (model) =>
        new WobbleScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<WobbleScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: StellarWobbleColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new WobbleKeyboardHelpContent(),
          homeScreenIcon: createWobbleIcon(),
          navigationBarIcon: createWobbleIcon(),
        },
        options,
      ),
    );
  }
}
