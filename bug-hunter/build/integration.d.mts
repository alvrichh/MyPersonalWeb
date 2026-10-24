import type { Plugin } from 'vite';
export function within(parent: string, file: string): string | null;
export function pageHtml(template: string): string;
export function prepareGame(root: string, command?: 'serve' | 'build'): string;
export function gameSourcePlugin(root: string, publicDir: string): Plugin;
