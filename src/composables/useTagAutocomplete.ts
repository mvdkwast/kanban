import { ref, computed, nextTick, type Ref, type ComputedRef } from 'vue';

/**
 * Calculates the pixel coordinates of the caret inside a textarea
 * by creating a hidden mirror div with identical styling.
 */
function getCaretCoordinates(textarea: HTMLTextAreaElement): { top: number; left: number } {
  const mirror = document.createElement('div');
  const style = window.getComputedStyle(textarea);

  const props = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
    'lineHeight', 'letterSpacing', 'wordSpacing',
    'textIndent', 'textTransform', 'whiteSpace',
    'wordWrap', 'overflowWrap', 'tabSize',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing',
  ];

  mirror.style.position = 'absolute';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.wordWrap = 'break-word';
  mirror.style.overflow = 'hidden';
  mirror.style.width = `${textarea.clientWidth}px`;

  for (const prop of props) {
    const cssProp = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
    mirror.style.setProperty(cssProp, style.getPropertyValue(cssProp));
  }

  document.body.appendChild(mirror);

  const cursor = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursor);

  const textNode = document.createTextNode(textBefore);
  mirror.appendChild(textNode);

  const marker = document.createElement('span');
  marker.textContent = '\u200b'; // zero-width space
  mirror.appendChild(marker);

  const mirrorRect = mirror.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();

  const top = markerRect.top - mirrorRect.top - textarea.scrollTop;
  const left = markerRect.left - mirrorRect.left;

  document.body.removeChild(mirror);
  return { top, left };
}

export function useTagAutocomplete(
  textareaRef: Ref<HTMLTextAreaElement | null | undefined>,
  content: Ref<string>,
  allTags: Ref<string[]> | ComputedRef<string[]>,
) {
  const dropdownRef = ref<HTMLElement | null>(null);
  const acActive = ref(false);
  const acHashPos = ref(-1);
  const acSelectedIndex = ref(0);
  const acPrefix = ref('');
  const dropdownStyle = ref<Record<string, string>>({});

  const acFilteredTags = computed(() => {
    if (!acActive.value) return [];
    const prefix = acPrefix.value.toLowerCase();
    if (prefix === '') {
      return allTags.value.slice(0, 5);
    }
    return allTags.value.filter(tag =>
      tag.slice(1).toLowerCase().startsWith(prefix)
    );
  });

  const closeAutocomplete = () => {
    acActive.value = false;
    acHashPos.value = -1;
    acSelectedIndex.value = 0;
    acPrefix.value = '';
  };

  const updateDropdownPosition = () => {
    const textarea = textareaRef.value;
    if (!textarea) return;

    const coords = getCaretCoordinates(textarea);
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight) || 20;

    // Clamp left so dropdown stays within textarea width
    const maxLeft = textarea.clientWidth - 192; // 192px = w-48
    const left = Math.max(0, Math.min(coords.left, maxLeft));

    dropdownStyle.value = {
      position: 'absolute',
      top: `${coords.top + lineHeight + 2}px`,
      left: `${left}px`,
    };
  };

  const insertCompletion = (tag: string) => {
    if (!textareaRef.value) return;
    const cursor = textareaRef.value.selectionStart;
    const before = content.value.substring(0, acHashPos.value);
    const after = content.value.substring(cursor);
    content.value = before + tag + after;
    closeAutocomplete();
    nextTick(() => {
      const newPos = before.length + tag.length;
      textareaRef.value?.setSelectionRange(newPos, newPos);
      textareaRef.value?.focus();
    });
  };

  const scrollSelectedIntoView = () => {
    nextTick(() => {
      const el = dropdownRef.value?.querySelector(`[data-ac-index="${acSelectedIndex.value}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    });
  };

  const handleAutocompleteInput = () => {
    if (!textareaRef.value) return;
    const cursor = textareaRef.value.selectionStart;

    if (acActive.value) {
      if (content.value[acHashPos.value] !== '#') {
        closeAutocomplete();
        return;
      }
      if (cursor <= acHashPos.value) {
        closeAutocomplete();
        return;
      }
      const prefix = content.value.substring(acHashPos.value + 1, cursor);
      if (/[^\w]/.test(prefix)) {
        closeAutocomplete();
        return;
      }
      acPrefix.value = prefix;
      acSelectedIndex.value = 0;
      updateDropdownPosition();
      return;
    }

    // Detect new # typed
    if (cursor > 0 && content.value[cursor - 1] === '#') {
      const charBefore = cursor > 1 ? content.value[cursor - 2] : null;
      if (charBefore === null || /[\s]/.test(charBefore)) {
        acHashPos.value = cursor - 1;
        acActive.value = true;
        acSelectedIndex.value = 0;
        acPrefix.value = '';
        updateDropdownPosition();
      }
    }
  };

  /** Returns true if the key was consumed by autocomplete */
  const handleAutocompleteKeyDown = (e: KeyboardEvent): boolean => {
    if (!acActive.value || acFilteredTags.value.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      acSelectedIndex.value = (acSelectedIndex.value + 1) % acFilteredTags.value.length;
      scrollSelectedIntoView();
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      acSelectedIndex.value = (acSelectedIndex.value - 1 + acFilteredTags.value.length) % acFilteredTags.value.length;
      scrollSelectedIntoView();
      return true;
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
      e.preventDefault();
      insertCompletion(acFilteredTags.value[acSelectedIndex.value]);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAutocomplete();
      return true;
    }
    return false;
  };

  return {
    dropdownRef,
    acActive,
    acFilteredTags,
    acSelectedIndex,
    dropdownStyle,
    closeAutocomplete,
    insertCompletion,
    handleAutocompleteInput,
    handleAutocompleteKeyDown,
  };
}
