/**
 * TagSelectionManager - Core logic for tag selection behavior
 * Handles state management and business logic, framework-agnostic
 */
export class TagSelectionManager {
  private prefix = '#';
  private focusedTag: string | null = null;
  private selection = new Set<string>();
  private savedSelection = new Set<string>();
  public lastFocusedTag: string | null = null;
  
  constructor(
    private allTags: string[],
    initialSelection: string[] = []
  ) {
    this.selection = new Set(initialSelection);
    this.savedSelection = new Set(initialSelection);
  }
  
  // State getters
  getPrefix(): string {
    return this.prefix;
  }
  
  getFocusedTag(): string | null {
    return this.focusedTag;
  }
  
  getSelection(): string[] {
    return Array.from(this.selection);
  }
  
  getSavedSelection(): string[] {
    return Array.from(this.savedSelection);
  }
  
  isInManualMode(): boolean {
    return this.prefix === '#';
  }
  
  isInPreviewMode(): boolean {
    return this.prefix.length > 1;
  }
  
  // Matching logic
  getMatchingTags(): string[] {
    if (this.prefix === '#') return this.allTags;
    // Tags include the # character, so we need to compare with full prefix
    const searchTerm = this.prefix.toLowerCase();
    return this.allTags.filter(tag => 
      tag.toLowerCase().startsWith(searchTerm)
    );
  }
  
  isTagMatching(tag: string): boolean {
    return this.getMatchingTags().includes(tag);
  }
  
  // Active filtering logic
  getActiveFilterTags(): string[] {
    if (this.isInManualMode()) {
      return this.getSelection();
    } else {
      // Preview mode: use focused tag if it exists
      return this.focusedTag ? [this.focusedTag] : [];
    }
  }
  
  // Focus management
  initializeFocus(): void {
    const matchingTags = this.getMatchingTags();
    if (matchingTags.length === 0) {
      this.focusedTag = null;
      return;
    }
    
    // Try to restore last focused tag
    if (this.lastFocusedTag && matchingTags.includes(this.lastFocusedTag)) {
      this.focusedTag = this.lastFocusedTag;
    } else if (this.selection.size > 0) {
      // Try first selected tag that matches
      const firstSelected = Array.from(this.selection).find(tag => 
        matchingTags.includes(tag)
      );
      this.focusedTag = firstSelected || matchingTags[0];
    } else {
      this.focusedTag = matchingTags[0];
    }
  }
  
  moveFocus(direction: 'left' | 'right'): void {
    const matchingTags = this.getMatchingTags();
    if (matchingTags.length === 0) return;
    
    const currentIndex = this.focusedTag 
      ? matchingTags.indexOf(this.focusedTag)
      : -1;
      
    if (currentIndex === -1) {
      this.focusedTag = matchingTags[0];
      return;
    }
    
    const newIndex = direction === 'right'
      ? Math.min(currentIndex + 1, matchingTags.length - 1)
      : Math.max(currentIndex - 1, 0);
      
    this.focusedTag = matchingTags[newIndex];
    this.lastFocusedTag = this.focusedTag;
  }
  
  // Prefix management
  addCharacter(char: string): void {
    this.prefix += char;
    this.updateFocusAfterPrefixChange();
  }
  
  removeLastCharacter(): boolean {
    if (this.prefix === '#') {
      return false; // Signal to exit mode
    }
    this.prefix = this.prefix.slice(0, -1);
    this.updateFocusAfterPrefixChange();
    return true;
  }
  
  resetPrefix(): void {
    this.prefix = '#';
    this.updateFocusAfterPrefixChange();
  }
  
  private updateFocusAfterPrefixChange(): void {
    const matchingTags = this.getMatchingTags();
    if (matchingTags.length === 0) {
      this.focusedTag = null;
    } else if (!this.focusedTag || !matchingTags.includes(this.focusedTag)) {
      this.focusedTag = matchingTags[0];
    }
  }
  
  // Selection management
  handleSpace(withShift: boolean): void {
    if (!this.focusedTag) return;
    
    if (this.isInManualMode()) {
      if (withShift) {
        // Toggle focused tag only
        if (this.selection.has(this.focusedTag)) {
          this.selection.delete(this.focusedTag);
        } else {
          this.selection.add(this.focusedTag);
        }
      } else {
        // Clear others and toggle focused
        const wasSelected = this.selection.has(this.focusedTag);
        this.selection.clear();
        if (!wasSelected) {
          this.selection.add(this.focusedTag);
        }
      }
    } else {
      // Preview mode
      if (withShift) {
        // Restore saved and add focused
        this.selection = new Set(this.savedSelection);
        this.selection.add(this.focusedTag);
      } else {
        // Set selection to focused only
        this.selection.clear();
        this.selection.add(this.focusedTag);
        this.resetPrefix();
      }
    }
  }
  
  handleEnter(withShift: boolean): { shouldExit: boolean } {
    if (!this.focusedTag) return { shouldExit: false };
    
    if (this.isInManualMode()) {
      if (withShift) {
        this.selection.add(this.focusedTag);
      } else {
        this.selection.clear();
        this.selection.add(this.focusedTag);
      }
    } else {
      // Preview mode
      if (withShift) {
        this.selection = new Set(this.savedSelection);
        this.selection.add(this.focusedTag);
      } else {
        this.selection.clear();
        this.selection.add(this.focusedTag);
      }
    }
    
    return { shouldExit: true };
  }
  
  handleClick(tag: string, withShift: boolean): void {
    this.focusedTag = tag;
    this.lastFocusedTag = tag;
    
    if (withShift) {
      // Toggle only this tag
      if (this.selection.has(tag)) {
        this.selection.delete(tag);
      } else {
        this.selection.add(tag);
      }
    } else {
      // Smart toggle based on current selection
      if (this.selection.size > 1 && this.selection.has(tag)) {
        // Multiple selected, clicking selected one: select only this
        this.selection.clear();
        this.selection.add(tag);
      } else if (this.selection.size === 1 && this.selection.has(tag)) {
        // Only this selected: deselect
        this.selection.clear();
      } else {
        // Not selected or others selected: select only this
        this.selection.clear();
        this.selection.add(tag);
      }
    }
  }
  
  handleEscape(): { shouldExit: boolean } {
    if (this.isInPreviewMode()) {
      // First escape in preview mode: return to manual mode
      this.resetPrefix();
      return { shouldExit: false };
    } else {
      // Manual mode: restore saved selection and exit
      this.selection = new Set(this.savedSelection);
      return { shouldExit: true };
    }
  }
  
  // Mode lifecycle
  enterMode(currentSelection: string[]): void {
    this.selection = new Set(currentSelection);
    this.savedSelection = new Set(currentSelection);
    this.prefix = '#';
    this.initializeFocus();
  }
  
  exitMode(): void {
    this.prefix = '#';
    this.focusedTag = null;
  }
  
  // Update available tags
  updateTags(newTags: string[]): void {
    this.allTags = newTags;
    // Clean up selection if tags no longer exist
    this.selection = new Set(
      Array.from(this.selection).filter(tag => newTags.includes(tag))
    );
    this.updateFocusAfterPrefixChange();
  }
}