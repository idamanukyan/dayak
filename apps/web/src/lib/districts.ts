/** Approximate Yerevan district centroids (lat, lng). Client-safe (plain data). */
export const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  KENTRON: [40.181, 44.514],
  ARABKIR: [40.204, 44.493],
  KANAKER_ZEYTUN: [40.207, 44.535],
  AJAPNYAK: [40.192, 44.455],
  DAVTASHEN: [40.223, 44.47],
  NOR_NORK: [40.205, 44.562],
  EREBUNI: [40.14, 44.53],
  SHENGAVIT: [40.148, 44.48],
  MALATIA_SEBASTIA: [40.16, 44.46],
  AVAN: [40.223, 44.545],
  NUBARASHEN: [40.115, 44.545],
  NORK_MARASH: [40.175, 44.545],
  OTHER: [40.181, 44.514],
};

/** Jitter a coordinate by roughly ±300 m (spec 11.3 — public map privacy). */
export function jitterCoord(lat: number, lng: number): [number, number] {
  const dLat = (Math.random() - 0.5) * 2 * 0.0027;
  const dLng = (Math.random() - 0.5) * 2 * 0.0035;
  return [lat + dLat, lng + dLng];
}
