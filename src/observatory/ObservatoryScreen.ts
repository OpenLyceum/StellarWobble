/**
 * ObservatoryScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createObservatoryIcon() in src/common/StellarWobbleScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createObservatoryIcon } from "../common/StellarWobbleScreenIcons.js";
import StellarWobbleColors from "../StellarWobbleColors.js";
import { ObservatoryModel } from "./model/ObservatoryModel.js";
import { ObservatoryKeyboardHelpContent } from "./view/ObservatoryKeyboardHelpContent.js";
import { ObservatoryScreenView } from "./view/ObservatoryScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ObservatoryScreenOptions = ScreenOptions & { tandem: Tandem };

export class ObservatoryScreen extends Screen<ObservatoryModel, ObservatoryScreenView> {
  public constructor(options: ObservatoryScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ObservatoryModel(),
      // View factory — receives the model instance
      (model) =>
        new ObservatoryScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ObservatoryScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: StellarWobbleColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ObservatoryKeyboardHelpContent(),
          homeScreenIcon: createObservatoryIcon(),
          navigationBarIcon: createObservatoryIcon(),
        },
        options,
      ),
    );
  }
}
