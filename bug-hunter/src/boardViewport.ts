/** Keep preparation's reserved UI space while the shop is replaced by combat controls.
 * Pure geometry: the wall's raise/lower animation remains the renderer's responsibility.
 */
export function createBoardViewport() {
  let prepared: { width: number; inset: number; floorInset?: number; floorScale?: number } | undefined;
  return {
    bottom(width: number, height: number, top: number, measured: number, prep: boolean) {
      if (prep || !prepared) {
        prepared = { width, inset: Math.max(0, height - measured) };
        return measured;
      }
      // Shop and bench sizes follow the viewport width, not the current combat UI.
      const inset = prepared.inset * width / Math.max(1, prepared.width);
      return Math.max(top + 120, Math.min(height, height - inset));
    },
    floor(width: number, height: number, top: number, bottom: number, scale: number | undefined, prep: boolean) {
      if (!prepared) return { bottom, widthScale: scale };
      if (prep) {
        prepared.floorInset = Math.max(0, height - bottom);
        prepared.floorScale = scale;
        return { bottom, widthScale: scale };
      }
      const inset = (prepared.floorInset ?? Math.max(0, height - bottom)) * width / Math.max(1, prepared.width);
      return {
        bottom: Math.max(top + 120, Math.min(height, height - inset)),
        widthScale: prepared.floorScale ?? scale,
      };
    },
    reset() { prepared = undefined; },
  };
}
