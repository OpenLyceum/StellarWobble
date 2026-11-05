/**
 * DopplerScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createDopplerIcon() in src/common/StellarWobbleScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createDopplerIcon } from "../common/StellarWobbleScreenIcons.js";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { DopplerModel } from "./model/DopplerModel.js";
import { DopplerKeyboardHelpContent } from "./view/DopplerKeyboardHelpContent.js";
import { DopplerScreenView } from "./view/DopplerScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type DopplerScreenOptions = ScreenOptions & { tandem: Tandem };

export class DopplerScreen extends Screen<DopplerModel, DopplerScreenView> {
  public constructor(options: DopplerScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new DopplerModel(),
      // View factory — receives the model instance
      (model) =>
        new DopplerScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<DopplerScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: StellarWobbleColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new DopplerKeyboardHelpContent(),
          homeScreenIcon: createDopplerIcon(),
          navigationBarIcon: createDopplerIcon(),
        },
        options,
      ),
    );
  }
}
