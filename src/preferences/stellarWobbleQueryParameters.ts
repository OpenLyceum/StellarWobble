/**
 * stellarWobbleQueryParameters.ts
 *
 * Sim-specific startup query parameters. This is the single place where every
 * sim-specific query parameter is declared and documented. Public-facing
 * parameters (intended for end users / sharing links) set `public: true`.
 *
 * Usage: append e.g. `?showEquations` to the sim URL.
 */

import { logGlobal } from "scenerystack/phet-core";
import { QueryStringMachine } from "scenerystack/query-string-machine";
import StellarWobbleNamespace from "../StellarWobbleNamespace.js";

const stellarWobbleQueryParameters = QueryStringMachine.getAll({
  /**
   * Shows the equations (Δλ/λ = v_r/c, K and M sin i) beside the readouts. Off by
   * default because the sim is pitched at introductory astronomy.
   */
  showEquations: {
    type: "flag",
    public: true,
  },
});

StellarWobbleNamespace.register("stellarWobbleQueryParameters", stellarWobbleQueryParameters);

// Log query parameters (for the console / PhET-iO).
logGlobal("phet.chipper.queryParameters");

export default stellarWobbleQueryParameters;
