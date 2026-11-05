/**
 * SpectrumStripNode.ts
 *
 * A spectrum drawn the way it looks through a spectrograph: each pixel column
 * is the colour of its wavelength at the brightness of the spectrum there. A
 * star's absorption spectrum becomes a rainbow crossed by dark lines.
 *
 * Drawn on a canvas, one fillRect per pixel column, and repainted only when one
 * of the `dependencies` changes. Adapted from LightAndAtoms' SpectrumStripNode
 * to take an intensity function instead of a sampled grid, so a zoom window
 * a couple of nanometres wide is drawn at full resolution.
 */

import { Multilink, type TReadOnlyProperty, type UnknownMultilink } from "scenerystack/axon";
import { Bounds2 } from "scenerystack/dot";
import { CanvasNode, type CanvasNodeOptions } from "scenerystack/scenery";
import { VisibleColor } from "scenerystack/scenery-phet";

/** Display gamma: VisibleColor values are already encoded, so scale them by brightness^(1/γ). */
const DISPLAY_GAMMA = 2.2;

export class SpectrumStripNode extends CanvasNode {
  private readonly stripWidth: number;
  private readonly stripHeight: number;
  private readonly minWavelength: number;
  private readonly maxWavelength: number;
  private readonly intensity: (wavelength: number) => number;
  private readonly columnColors: readonly (readonly [number, number, number])[];
  private readonly multilink: UnknownMultilink | null;

  /**
   * @param width - strip width, px
   * @param height - strip height, px
   * @param minWavelength - wavelength at the left edge, nm
   * @param maxWavelength - wavelength at the right edge, nm
   * @param intensity - normalised brightness (0–1) at a wavelength, nm
   * @param dependencies - Properties whose changes require a repaint
   */
  public constructor(
    width: number,
    height: number,
    minWavelength: number,
    maxWavelength: number,
    intensity: (wavelength: number) => number,
    dependencies: readonly TReadOnlyProperty<unknown>[],
    options?: CanvasNodeOptions,
  ) {
    super({ canvasBounds: new Bounds2(0, 0, width, height), ...options });

    this.stripWidth = width;
    this.stripHeight = height;
    this.minWavelength = minWavelength;
    this.maxWavelength = maxWavelength;
    this.intensity = intensity;

    // Colour of each column's wavelength at full brightness.
    this.columnColors = Array.from({ length: Math.ceil(width) }, (_, column) => {
      const color = VisibleColor.wavelengthToColor(this.columnWavelength(column));
      return [color.red, color.green, color.blue] as const;
    });

    this.multilink =
      dependencies.length > 0 ? Multilink.multilinkAny(dependencies, () => this.invalidatePaint()) : null;
    this.invalidatePaint();
  }

  /** Wavelength at the centre of a pixel column, nm. */
  private columnWavelength(column: number): number {
    return this.minWavelength + ((column + 0.5) / this.stripWidth) * (this.maxWavelength - this.minWavelength);
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    context.fillStyle = "black";
    context.fillRect(0, 0, this.stripWidth, this.stripHeight);
    this.columnColors.forEach(([r, g, b], column) => {
      const value = Math.min(1, Math.max(0, this.intensity(this.columnWavelength(column))));
      const brightness = value ** (1 / DISPLAY_GAMMA);
      if (brightness > 0.01) {
        context.fillStyle = `rgb(${Math.round(r * brightness)},${Math.round(g * brightness)},${Math.round(b * brightness)})`;
        // Overlap by a pixel fraction so antialiasing leaves no seams between columns.
        context.fillRect(column, 0, 1.5, this.stripHeight);
      }
    });
  }

  public override dispose(): void {
    this.multilink?.dispose();
    super.dispose();
  }
}
