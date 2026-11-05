/**
 * ObservatoryTarget.ts
 *
 * The stars the Observatory screen can point at: a randomly generated mystery
 * star, real stars with short-period planets (a few nights of data cover
 * several orbits), and the Sun as Jupiter or Earth would make it wobble.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class ObservatoryTarget extends EnumerationValue {
  /** A random star with one planet, regenerated with "New mystery star". */
  public static readonly MYSTERY = new ObservatoryTarget();

  /** 51 Pegasi b, the first planet found around a Sun-like star (1995). */
  public static readonly FIFTY_ONE_PEG = new ObservatoryTarget();

  /** HD 189733 b, a hot Jupiter around a K dwarf: the largest signal (K ≈ 205 m/s, P ≈ 2.2 d). */
  public static readonly HD_189733 = new ObservatoryTarget();

  /** HD 179949 b, a hot Jupiter around an F star (K ≈ 113 m/s, P ≈ 3.1 d). */
  public static readonly HD_179949 = new ObservatoryTarget();

  /** HD 209458 b, the first planet seen to transit its star (K ≈ 85 m/s, P ≈ 3.5 d). */
  public static readonly HD_209458 = new ObservatoryTarget();

  /** HD 46375 b, a hot Saturn (K ≈ 34 m/s, P ≈ 3.0 d). */
  public static readonly HD_46375 = new ObservatoryTarget();

  /** Gliese 436 b, a hot Neptune around a red dwarf (K ≈ 17 m/s, P ≈ 2.6 d). */
  public static readonly GLIESE_436 = new ObservatoryTarget();

  /** Proxima Centauri b, an Earth-mass planet around the nearest star (K ≈ 1.2 m/s, P ≈ 11 d). */
  public static readonly PROXIMA_CENTAURI = new ObservatoryTarget();

  /** The Sun as Jupiter makes it wobble, seen edge-on from afar. */
  public static readonly SUN_JUPITER = new ObservatoryTarget();

  /** The Sun as Earth makes it wobble, seen edge-on from afar (9 cm/s). */
  public static readonly SUN_EARTH = new ObservatoryTarget();

  public static readonly enumeration = new Enumeration(ObservatoryTarget);
}
