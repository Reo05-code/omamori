/**
 * 位置情報関連のユーティリティ関数
 */

/**
 * WKT形式の POINT 文字列から緯度経度を抽出
 *
 * @param homeLocation - "POINT (lon lat)" 形式の文字列
 * @returns { lat: number, lon: number } または null
 *
 * @example
 * parseHomeLocation("POINT (0.0 0.0)")
 * // => { lat: 0.0, lon: 0.0 }
 */
export function parseHomeLocation(
  homeLocation: string | null | undefined,
): { lat: number; lon: number } | null {
  if (!homeLocation) return null;

  // "POINT (lon lat)" format を parse
  const match = homeLocation.match(/POINT\s*\(\s*([\d.-]+)\s+([\d.-]+)\s*\)/);
  if (!match) return null;

  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);

  if (isNaN(lon) || isNaN(lat)) return null;

  return { lat, lon };
}
