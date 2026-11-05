/**
 * Memory-leak regression suite (fleet standard).
 *
 * Every object that links Properties, adds listeners, or owns child nodes, with
 * a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts checks that each one is garbage collected after
 * dispose() and leaves no survivors across repeated cycles.
 */

import { BooleanProperty, NumberProperty } from "scenerystack/axon";
import { OrbitalSystem } from "../src/common/model/OrbitalSystem.js";
import { H_ALPHA } from "../src/common/model/stellarSpectrum.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { FullSpectrumNode } from "../src/common/view/FullSpectrumNode.js";
import { SpectralLineZoomNode } from "../src/common/view/SpectralLineZoomNode.js";
import { SpectrumStripNode } from "../src/common/view/SpectrumStripNode.js";
import { StarNode } from "../src/common/view/StarNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

// Long-lived Properties the disposable nodes link to (as model Properties are in the sim).
const velocityProperty = new NumberProperty(1000);
const magnificationProperty = new NumberProperty(1);
const massProperty = new NumberProperty(1);
const flagProperty = new BooleanProperty(false);

describeDisposalLeaks([
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "OrbitalSystem", create: () => new OrbitalSystem() },
  { name: "StarNode", create: () => new StarNode(massProperty, 10) },
  {
    name: "SpectrumStripNode",
    create: () => new SpectrumStripNode(100, 10, 400, 700, () => 1, [velocityProperty, flagProperty]),
  },
  {
    name: "SpectralLineZoomNode",
    create: () => new SpectralLineZoomNode(H_ALPHA, velocityProperty, magnificationProperty),
  },
  { name: "FullSpectrumNode", create: () => new FullSpectrumNode(velocityProperty, 200) },
]);
