/**
 * ObservatoryScreenView.ts
 *
 * The Observatory screen: find a planet in noisy radial-velocity data.
 *
 *  - Top left: the measurements (ObservatoryChartNode), or their periodogram
 *    (PeriodogramNode) when "Periodogram" is checked.
 *  - Bottom left: the user's model (period, amplitude, phase), fold, show and
 *    periodogram options, and the scatter about the model, in m/s and in error bars.
 *  - Right: the target, the spectrograph, the observing buttons, and the result
 *    (minimum mass, reveal answer).
 */

import { DerivedProperty, PatternStringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { AquaRadioButtonGroup, ComboBox, TextPushButton } from "scenerystack/sun";
import {
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  FLAT_RESET_ALL_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
  STELLAR_WOBBLE_COMBO_BOX_OPTIONS,
} from "../../common/StellarWobbleButtonOptions.js";
import { StellarWobblePanel } from "../../common/StellarWobblePanel.js";
import { formatSignificant } from "../../common/view/chartUtils.js";
import {
  createCheckbox,
  createEquationNode,
  createExplanationButton,
  createNumberControl,
} from "../../common/view/controls.js";
import { formatPlanetMass, unitsDependencies } from "../../common/view/formatters.js";
import { StringManager } from "../../i18n/StringManager.js";
import StellarWobbleColors from "../../StellarWobbleColors.js";
import {
  CADENCE_RANGE_DAYS,
  CONTROL_PANEL_WIDTH,
  FIT_AMPLITUDE_RANGE_MS,
  FIT_AMPLITUDE_STEP_DECADES,
  FIT_PERIOD_RANGE_DAYS,
  FIT_PERIOD_STEP_DECADES,
  FONTS,
  INSTRUMENT_PRECISIONS_MS,
  SCREEN_VIEW_MARGIN,
  STELLAR_JITTER_MS,
} from "../../StellarWobbleConstants.js";
import type { ObservatoryModel } from "../model/ObservatoryModel.js";
import { ObservatoryTarget } from "../model/ObservatoryTarget.js";
import { signalMinimumMass } from "../model/PlanetSignal.js";
import { ObservatoryChartNode } from "./ObservatoryChartNode.js";
import { ObservatoryScreenSummaryContent } from "./ObservatoryScreenSummaryContent.js";
import { PeriodogramNode } from "./PeriodogramNode.js";

export type ObservatoryScreenViewOptions = ScreenViewOptions;

const CHART_WIDTH = 610;
const CHART_HEIGHT = 330;

/** Targets whose planet also transits: their answer points to Transit Hunter. */
const TRANSITING_TARGETS: readonly ObservatoryTarget[] = [ObservatoryTarget.HD_189733, ObservatoryTarget.HD_209458];

export class ObservatoryScreenView extends ScreenView {
  public constructor(model: ObservatoryModel, providedOptions?: ObservatoryScreenViewOptions) {
    const options = optionize<ObservatoryScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new ObservatoryScreenSummaryContent(model),
      },
      providedOptions,
    );
    super(options);

    const stringManager = StringManager.getInstance();
    const strings = stringManager.getObservatoryStrings();
    const common = stringManager.getCommonStrings();
    const units = stringManager.getUnits();
    const a11y = stringManager.getObservatoryA11yStrings();
    const bounds = this.layoutBounds;

    const label = (text: TReadOnlyProperty<string>, maxWidth = CONTROL_PANEL_WIDTH): Text =>
      new Text(text, { font: FONTS.LABEL, fill: StellarWobbleColors.textColorProperty, maxWidth: maxWidth });
    const pushButton = (text: TReadOnlyProperty<string>, listener: () => void): TextPushButton =>
      new TextPushButton(text, {
        ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
        font: FONTS.LABEL,
        textFill: LIGHT_SURFACE_TEXT_FILL,
        maxTextWidth: CONTROL_PANEL_WIDTH / 2 - 16,
        listener: listener,
      });

    // ── Chart ─────────────────────────────────────────────────────────────────
    const chart = new ObservatoryChartNode(model, CHART_WIDTH, CHART_HEIGHT);
    chart.left = bounds.minX + SCREEN_VIEW_MARGIN + 50;
    chart.top = bounds.minY + SCREEN_VIEW_MARGIN + 22;
    const periodogram = new PeriodogramNode(model, CHART_WIDTH, CHART_HEIGHT);
    periodogram.translation = chart.translation;
    model.showPeriodogramProperty.link((show) => {
      periodogram.visible = show;
      chart.visible = !show;
    });

    // ── Observing panel ───────────────────────────────────────────────────────
    const targetItems = [
      { value: ObservatoryTarget.MYSTERY, string: strings.mysteryStarStringProperty },
      { value: ObservatoryTarget.FIFTY_ONE_PEG, string: strings.fiftyOnePegStringProperty },
      { value: ObservatoryTarget.HD_189733, string: strings.hd189733StringProperty },
      { value: ObservatoryTarget.HD_179949, string: strings.hd179949StringProperty },
      { value: ObservatoryTarget.HD_209458, string: strings.hd209458StringProperty },
      { value: ObservatoryTarget.HD_46375, string: strings.hd46375StringProperty },
      { value: ObservatoryTarget.GLIESE_436, string: strings.gliese436StringProperty },
      { value: ObservatoryTarget.PROXIMA_CENTAURI, string: strings.proximaCentauriStringProperty },
      { value: ObservatoryTarget.SUN_JUPITER, string: strings.sunJupiterStringProperty },
      { value: ObservatoryTarget.SUN_EARTH, string: strings.sunEarthStringProperty },
    ].map((item) => ({
      value: item.value,
      createNode: () =>
        new Text(item.string, { font: FONTS.LABEL, fill: LIGHT_SURFACE_TEXT_FILL, maxWidth: CONTROL_PANEL_WIDTH - 60 }),
    }));
    const comboListParent = new Node();
    const targetComboBox = new ComboBox(model.targetProperty, targetItems, comboListParent, {
      ...STELLAR_WOBBLE_COMBO_BOX_OPTIONS,
      accessibleName: a11y.controls.targetStringProperty,
    });
    const newMysteryButton = pushButton(strings.newMysteryStringProperty, () => model.newMysteryStar());
    const starMassText = new RichText(
      new PatternStringProperty(strings.starMassPatternStringProperty, {
        value: new DerivedProperty([model.signalProperty], (signal) => formatSignificant(signal.starMass, 3)),
      }),
      { font: FONTS.SMALL, fill: StellarWobbleColors.mutedTextColorProperty, maxWidth: CONTROL_PANEL_WIDTH },
    );

    const precisionRadios = new AquaRadioButtonGroup(
      model.precisionProperty,
      INSTRUMENT_PRECISIONS_MS.map((precision) => ({
        value: precision,
        createNode: () =>
          new Text(new PatternStringProperty(strings.precisionPatternStringProperty, { value: precision }), {
            font: FONTS.LABEL,
            fill: StellarWobbleColors.textColorProperty,
            maxWidth: 60,
          }),
      })),
      {
        orientation: "horizontal",
        spacing: 12,
        radioButtonOptions: { radius: 7 },
        accessibleName: a11y.controls.precisionStringProperty,
      },
    );
    const cadenceControl = createNumberControl(
      strings.cadenceStringProperty,
      model.cadenceProperty,
      CADENCE_RANGE_DAYS,
      {
        unitsProperty: units.dayAbbreviationStringProperty,
        logarithmic: true,
        significantFigures: 2,
        accessibleName: a11y.controls.cadenceStringProperty,
      },
    );
    const jitterCheckbox = createCheckbox(
      model.jitterProperty,
      new PatternStringProperty(strings.jitterPatternStringProperty, { value: STELLAR_JITTER_MS }),
    );
    const observeOneButton = pushButton(strings.observeOneStringProperty, () => model.observe(1));
    const observeTenButton = pushButton(strings.observeTenStringProperty, () => model.observe(10));
    const clearButton = pushButton(strings.clearDataStringProperty, () => model.clearData());
    const measurementsText = new Text(
      new PatternStringProperty(strings.measurementsPatternStringProperty, {
        count: model.measurementCountProperty,
        span: new DerivedProperty([model.measurementCountProperty], () => {
          const last = model.measurements[model.measurements.length - 1];
          return formatSignificant(last ? last.time : 0, 3);
        }),
      }),
      { font: FONTS.SMALL, fill: StellarWobbleColors.mutedTextColorProperty, maxWidth: CONTROL_PANEL_WIDTH },
    );

    const observingPanel = new StellarWobblePanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          label(strings.targetStringProperty),
          targetComboBox,
          newMysteryButton,
          starMassText,
          label(strings.precisionStringProperty),
          precisionRadios,
          cadenceControl,
          jitterCheckbox,
          new HBox({ spacing: 8, children: [observeOneButton, observeTenButton] }),
          clearButton,
          measurementsText,
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );
    observingPanel.right = bounds.maxX - SCREEN_VIEW_MARGIN;
    observingPanel.top = bounds.minY + SCREEN_VIEW_MARGIN;
    model.targetProperty.link((target) => {
      newMysteryButton.enabled = target === ObservatoryTarget.MYSTERY;
    });

    // ── Fit panel ─────────────────────────────────────────────────────────────
    const periodControl = createNumberControl(
      strings.fitPeriodStringProperty,
      model.fitPeriodProperty,
      FIT_PERIOD_RANGE_DAYS,
      {
        unitsProperty: units.daysStringProperty,
        logarithmic: true,
        significantFigures: 5,
        delta: FIT_PERIOD_STEP_DECADES,
        accessibleName: a11y.controls.fitPeriodStringProperty,
      },
    );
    const amplitudeControl = createNumberControl(
      strings.fitAmplitudeStringProperty,
      model.fitAmplitudeProperty,
      FIT_AMPLITUDE_RANGE_MS,
      {
        unitsProperty: units.metersPerSecondStringProperty,
        logarithmic: true,
        delta: FIT_AMPLITUDE_STEP_DECADES,
        accessibleName: a11y.controls.fitAmplitudeStringProperty,
      },
    );
    const phaseControl = createNumberControl(strings.fitPhaseStringProperty, model.fitPhaseProperty, new Range(0, 1), {
      significantFigures: 2,
      delta: 0.01,
      accessibleName: a11y.controls.fitPhaseStringProperty,
    });
    const foldCheckbox = createCheckbox(model.foldProperty, strings.foldDataStringProperty);
    const showModelCheckbox = createCheckbox(model.showModelProperty, strings.showModelStringProperty);
    const periodogramCheckbox = createCheckbox(model.showPeriodogramProperty, strings.periodogramStringProperty);
    const residualText = new Text(
      new PatternStringProperty(strings.residualPatternStringProperty, {
        value: new DerivedProperty([model.residualProperty], (residual) =>
          residual === null ? "—" : formatSignificant(residual, 3),
        ),
        ratio: new DerivedProperty([model.normalizedResidualProperty], (ratio) =>
          ratio === null ? "—" : formatSignificant(ratio, 2),
        ),
      }),
      { font: FONTS.READOUT, fill: StellarWobbleColors.fitCurveColorProperty, maxWidth: CHART_WIDTH },
    );

    const fitPanel = new StellarWobblePanel(
      new VBox({
        spacing: 8,
        align: "left",
        children: [
          new Text(strings.fitTitleStringProperty, {
            font: FONTS.TITLE,
            fill: StellarWobbleColors.fitCurveColorProperty,
            maxWidth: 300,
          }),
          new HBox({ spacing: 18, align: "top", children: [periodControl, amplitudeControl, phaseControl] }),
          new HBox({ spacing: 18, children: [foldCheckbox, showModelCheckbox, periodogramCheckbox] }),
          residualText,
        ],
      }),
    );
    fitPanel.left = bounds.minX + SCREEN_VIEW_MARGIN;
    fitPanel.bottom = bounds.maxY - SCREEN_VIEW_MARGIN;

    // ── Result panel ──────────────────────────────────────────────────────────
    const inferredMassText = new RichText(
      new PatternStringProperty(strings.inferredMassPatternStringProperty, {
        value: DerivedProperty.deriveAny([model.inferredMassProperty, ...unitsDependencies()], () =>
          formatPlanetMass(model.inferredMassProperty.value),
        ),
      }),
      { font: FONTS.READOUT, fill: StellarWobbleColors.fitCurveColorProperty, maxWidth: CONTROL_PANEL_WIDTH },
    );
    const equation = createEquationNode(strings.equationStringProperty, CONTROL_PANEL_WIDTH);
    const revealButton = pushButton(strings.revealStringProperty, () => {
      model.revealProperty.value = true;
    });
    const answerStringProperty = DerivedProperty.deriveAny(
      [
        model.signalProperty,
        model.precisionProperty,
        model.targetProperty,
        strings.answerPatternStringProperty,
        strings.noPlanetAnswerStringProperty,
        strings.transitsNoteStringProperty,
        ...unitsDependencies(),
      ],
      () => {
        const signal = model.signalProperty.value;
        const lines = [
          strings.answerPatternStringProperty.value
            .replace("{{period}}", formatSignificant(signal.period, 4))
            .replace("{{amplitude}}", formatSignificant(signal.amplitude, 3))
            .replace("{{mass}}", formatPlanetMass(signalMinimumMass(signal))),
        ];
        if (signal.amplitude < model.precisionProperty.value / 3) {
          lines.push(strings.noPlanetAnswerStringProperty.value);
        }
        if (TRANSITING_TARGETS.includes(model.targetProperty.value)) {
          lines.push(strings.transitsNoteStringProperty.value);
        }
        return lines.join("<br>");
      },
    );
    const answerText = new RichText(answerStringProperty, {
      font: FONTS.SMALL,
      fill: StellarWobbleColors.answerCurveColorProperty,
      lineWrap: CONTROL_PANEL_WIDTH,
      visibleProperty: model.revealProperty,
    });
    const explanationButton = createExplanationButton(
      strings.explanationTitleStringProperty,
      [
        strings.explanation1StringProperty,
        strings.explanation2StringProperty,
        strings.explanation3StringProperty,
        strings.explanation4StringProperty,
        strings.explanation5StringProperty,
        strings.explanation6StringProperty,
      ],
      a11y.controls.explanationStringProperty,
    );
    const resultPanel = new StellarWobblePanel(
      new VBox({
        spacing: 7,
        align: "left",
        children: [
          inferredMassText,
          equation,
          revealButton,
          answerText,
          new HBox({ spacing: 8, children: [explanationButton, label(common.explanationButtonStringProperty, 150)] }),
        ],
      }),
      { minWidth: CONTROL_PANEL_WIDTH + 24 },
    );
    resultPanel.right = observingPanel.right;
    resultPanel.top = observingPanel.bottom + 8;

    // ── Reset All ─────────────────────────────────────────────────────────────
    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        chart.reset();
      },
      right: bounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: bounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [chart, periodogram, fitPanel, observingPanel, resultPanel, resetAllButton, comboListParent];

    this.addChild(
      new Node({
        pdomOrder: [
          targetComboBox,
          newMysteryButton,
          precisionRadios,
          cadenceControl,
          jitterCheckbox,
          observeOneButton,
          observeTenButton,
          clearButton,
          ...chart.timeControls,
          periodogram.usePeakButton,
          periodControl,
          amplitudeControl,
          phaseControl,
          foldCheckbox,
          showModelCheckbox,
          periodogramCheckbox,
          revealButton,
          explanationButton,
          resetAllButton,
        ],
      }),
    );
  }
}
