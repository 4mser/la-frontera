// «sin texto» for every chapter: --props '{"limpio":true}' draws the same picture with no lettering (the trailer's
// hypercut); masks drawn in #fff (titles filled with fractals) still work
import { getInputProps } from "remotion";
export const LIMPIO = Boolean((getInputProps() as { limpio?: boolean }).limpio);
