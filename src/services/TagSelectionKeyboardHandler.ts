export function createTagSelectionKeyboardHandler(
  handleKeyDown: (e: KeyboardEvent) => boolean
) {
  return (e: KeyboardEvent): boolean => {
    return handleKeyDown(e);
  };
}