/**
 * ObservatoryKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Observatory screen: buttons, radio buttons and
 * checkboxes, and the target combo box on the left; the model and cadence
 * sliders on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class ObservatoryKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new BasicActionsKeyboardHelpSection({ withCheckboxContent: true }), new ComboBoxKeyboardHelpSection()],
      [new SliderControlsKeyboardHelpSection()],
    );
  }
}
