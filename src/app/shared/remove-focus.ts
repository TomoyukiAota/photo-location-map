export function removeFocus(): void {
  (document.activeElement as HTMLElement)?.blur?.();
}
