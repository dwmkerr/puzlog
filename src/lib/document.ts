export function getElementOrFail(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`failed to get required element: ${id}`);
  }
  return element;
}
