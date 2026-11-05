/**
 * ViewingAngleScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createViewingAngleIcon() in src/common/StellarWobbleScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createViewingAngleIcon } from "../common/StellarWobbleScreenIcons.js";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { ViewingAngleModel } from "./model/ViewingAngleModel.js";
import { ViewingAngleKeyboardHelpContent } from "./view/ViewingAngleKeyboardHelpContent.js";
import { ViewingAngleScreenView } from "./view/ViewingAngleScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ViewingAngleScreenOptions = ScreenOptions & { tandem: Tandem };

export class ViewingAngleScreen extends Screen<ViewingAngleModel, ViewingAngleScreenView> {
  public constructor(options: ViewingAngleScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ViewingAngleModel(),
      // View factory — receives the model instance
      (model) =>
        new ViewingAngleScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ViewingAngleScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: StellarWobbleColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ViewingAngleKeyboardHelpContent(),
          homeScreenIcon: createViewingAngleIcon(),
          navigationBarIcon: createViewingAngleIcon(),
        },
        options,
      ),
    );
  }
}
