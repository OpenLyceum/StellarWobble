/**
 * ViewingAngleKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Viewing Angle screen: buttons and the 3-D view
 * (arrow keys rotate it) on the left; the sliders and the time controls on the
 * right.
 */

import {
  BasicActionsKeyboardHelpSection,
  KeyboardHelpIconFactory,
  KeyboardHelpSection,
  KeyboardHelpSectionRow,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";
import { StringManager } from "../../i18n/StringManager.js";

export class ViewingAngleKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    const strings = StringManager.getInstance().getViewingAngleStrings();
    const rotateSection = new KeyboardHelpSection(strings.keyboardHelpHeadingStringProperty, [
      KeyboardHelpSectionRow.labelWithIcon(
        strings.keyboardHelpRotateStringProperty,
        KeyboardHelpIconFactory.arrowKeysRowIcon(),
      ),
    ]);
    super(
      [rotateSection, new BasicActionsKeyboardHelpSection()],
      [new SliderControlsKeyboardHelpSection(), new TimeControlsKeyboardHelpSection()],
    );
  }
}
