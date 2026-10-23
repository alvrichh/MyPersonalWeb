import * as renderer from './boardViewRender';
import { createBoardViewport } from './boardViewport';

// Preserve the public API used by main.ts. Rendering lives in boardViewRender.ts;
// this module owns the stable mobile viewport across preparation/fight/results.
export * from './boardViewRender';
const viewport = createBoardViewport();

export function layoutBoard(...args: Parameters<typeof renderer.layoutBoard>): ReturnType<typeof renderer.layoutBoard> {
  const fillHeight = args[6] ?? false;
  const canvas = typeof document === 'undefined' ? null : document.getElementById('stage');
  if (fillHeight && canvas && canvas.clientHeight > 0) {
    // renderBoardUi replaces the preparation controls before this call. Looking
    // at that current UI avoids a one-frame delay from the previous draw call.
    const prep = !!document.querySelector('.board-go[data-bact="fight"]');
    args[2] = viewport.bottom(args[0], canvas.clientHeight, args[1], args[2], prep);
  }
  return renderer.layoutBoard(...args);
}

export function drawBoard(...args: Parameters<typeof renderer.drawBoard>): ReturnType<typeof renderer.drawBoard> {
  const [ctx, board] = args;
  const floor = args[9];
  const outside = args[10] ?? false;
  if (!outside) {
    const height = ctx.canvas.clientHeight || ctx.canvas.height / args[6];
    const width = floor.width ?? (ctx.canvas.clientWidth || ctx.canvas.width / args[6]);
    args[9] = { ...floor, ...viewport.floor(width, height, floor.top, floor.bottom, floor.widthScale, board.phase === 'prep') };
  }
  return renderer.drawBoard(...args);
}
