import * as renderer from './boardViewRender';
import { CELL, HOME_ROW } from './board';
import { createBoardViewport } from './boardViewport';

// Preserve the public API used by main.ts. Rendering lives in boardViewRender.ts;
// this module owns the stable mobile viewport across preparation/fight/results.
export * from './boardViewRender';
const viewport = createBoardViewport();
const MOBILE_BOARD_DROP = 8;
const countOffsets = new WeakMap<HTMLElement, { x: number; y: number }>();

export function layoutBoard(...args: Parameters<typeof renderer.layoutBoard>): ReturnType<typeof renderer.layoutBoard> {
  const fillHeight = args[6] ?? false;
  const canvas = typeof document === 'undefined' ? null : document.getElementById('stage');
  if (fillHeight && canvas && canvas.clientHeight > 0) {
    // renderBoardUi replaces the preparation controls before this call. Looking
    // at that current UI avoids a one-frame delay from the previous draw call.
    const prep = !!document.querySelector('.board-go[data-bact="fight"]');
    args[2] = viewport.bottom(args[0], canvas.clientHeight, args[1], args[2], prep);
  }
  const layout = renderer.layoutBoard(...args);
  // Translate the grid, units and divider together, without resizing cells.
  // main.ts also uses this returned origin for dragging and hit testing.
  if (fillHeight) layout.oy += MOBILE_BOARD_DROP;
  return layout;
}

function placeMobileLabels(ctx: CanvasRenderingContext2D, board: Parameters<typeof renderer.drawBoard>[1], layout: renderer.BoardLayout, outside: boolean) {
  if (typeof document === 'undefined') return;
  const head = document.querySelector<HTMLElement>('.board-mobile-tray .board-bench-head');
  if (!head) return;
  const mobile = !outside && board.variant === 'tactics' && !!head.closest('.board-mobile-tray.is-active');
  const title = head.querySelector<HTMLElement>('.board-bench-title');
  if (title) title.style.textAlign = mobile ? 'left' : '';
  const count = head.querySelector<HTMLElement>('.board-count');
  if (!count) return;
  if (!mobile || board.phase !== 'prep') {
    count.style.transform = '';
    count.style.pointerEvents = '';
    countOffsets.delete(count);
    return;
  }
  const rect = ctx.canvas.getBoundingClientRect();
  const box = count.getBoundingClientRect();
  const previous = countOffsets.get(count) ?? { x: 0, y: 0 };
  const x = Math.round(previous.x + rect.left + layout.ox + 4 - box.left);
  const y = Math.round(previous.y + rect.top + layout.oy + HOME_ROW * CELL * layout.s + 4 - box.top);
  // Keep the original label in flow: the bench/shop geometry, live text and
  // translated accessibility label stay unchanged. It must not intercept drags.
  const transform = `translate(${x}px, ${y}px)`;
  if (count.style.transform !== transform) count.style.transform = transform;
  count.style.pointerEvents = 'none';
  countOffsets.set(count, { x, y });
}

export function drawBoard(...args: Parameters<typeof renderer.drawBoard>): ReturnType<typeof renderer.drawBoard> {
  const [ctx, board, layout] = args;
  const floor = args[9];
  const outside = args[10] ?? false;
  if (!outside) {
    const height = ctx.canvas.clientHeight || ctx.canvas.height / args[6];
    const width = floor.width ?? (ctx.canvas.clientWidth || ctx.canvas.width / args[6]);
    args[9] = { ...floor, ...viewport.floor(width, height, floor.top, floor.bottom, floor.widthScale, board.phase === 'prep') };
  }
  renderer.drawBoard(...args);
  placeMobileLabels(ctx, board, layout, outside);
}
