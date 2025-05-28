export function createSearchKeyboardHandler(
  handleKeyDown: (e: KeyboardEvent) => void
) {
  return (e: KeyboardEvent): boolean => {
    // Search widget handles its own keyboard events
    // We just need to let them through
    handleKeyDown(e);
    return false; // Don't prevent default, let the input handle it
  };
}