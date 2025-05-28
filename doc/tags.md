Tag selection mode allows to control the tag selection : one or more tags may be selected and control card visibility in the Kanban board.

Tags are filtered by a prefix, that can be edited by the user by entering characters after pressing #. The prefix includes the #. The user may also use backspace to remove the last character from the prefix, up to the # which cannot be deleted. Tags that do not match the prefix are darkened.

Unless the prefix doesn't match any tags, there is always one focused tag. Focus is independent of selection. The left and right arrow keys allow to move the focus between tags. Only non-darkened tags can be  reached.

When tag selection mode is entered, the current selection is saved. Escape restores the saved selection, and returns to navigation mode.

- Actions when prefix is #
    - the active tags used to filter the cards list corresponds to the selection
    - enter sets the selection to the focused tag, and switches to navigation mode
    - shift+enter adds the focused tag to the selection, and switches to navigation mode
    - space toggles the selected status of the focused tag, and clears the other tags from the selection. No mode switch.
    - shift+space toggles the selected status of the focused tag (but doesn't affect other tags) No mode switch.

- Actions when prefix is longer than #
    - the active tags used to filter the cards list corresponds to the focused tag. This allows to preview the filtering effect of the matched tags in the board.
    - enter sets the selection to the focused tag, and changes to navigation mode
    - shift+enter restores the saved selection, adds the focused tag to the selection, and switches to navigation mode.
    - space sets the selection to the focused tag, and resets the prefix to # . No mode switch
    - shift+space restores the saved selection, adds the focused tag. No mode switch.

When tag selection mode is left, the tag focus indicator is hidden.

When tag selection mode is entered, focus should be restored. If it cannot be restored, the left-most tag is focused.

Clicking on a tag clears the selection and toggles that tag. It is also mark as focused. No mode changes are performed.
Shift+Clicking on a tag toggle that tag but leaves the rest of the selection untouched. It also marked as focus. No mode changes are performed.


Questions/Unclear cases:

1. Empty matches: What happens when the typed prefix matches no tags? Should:
   - The mode exit automatically?
   - All tags remain darkened with no focus?
   - The prefix turn red or show some visual feedback?
2. Backspace at "#": When only "#" remains and user presses backspace, should it exit tag mode or just do nothing?
3. Initial focus logic: When entering tag mode with existing selection, which tag gets initial focus?
   - First selected tag?
   - Leftmost visible tag?
   - Last focused tag if remembered?
4. Click toggle semantics: "Clicking clears selection and toggles that tag" - if I click an already-selected tag, does the selection become empty, or does it become just that tag?
5. Space in preview mode: Should it clear other selections like in manual mode, or truly just set selection to the focused tag?

UX Suggestions:

1. Visual distinction: Consider different visual cues for manual vs preview mode (e.g., border color on the tag selector)
2. Escape behavior: Currently Escape restores saved selection. Consider making Escape from preview mode (longer prefix) first return to "#" mode, then second Escape exits entirely
3. Tab completion: When in preview mode with only one matching tag, Tab could complete the selection and exit
4. Visual feedback for "no matches": Maybe show a subtle message like "No matching tags" when prefix matches nothing

Would you like me to implement this according to your spec once we clarify these edge cases?


> To answer your questions :
1. all tags dark + prefix turned red seems good
2. pressing backspace at # : i think exiting tag mode would feel the most intuitive, since you can just retype it to reenter tag mode
3. initial focus should be on the last focused tag. Last focus can be acquired through previous interaction in tag mode, or when a tag is clicked
4. very good point. let's improve the semantics : if other tags were also selected, selection becomes just that tag. If not tag is toggled, so selection becomes effectively empty
5. by set selection to the focused tag i meant that the selection only contains that tag, so effectively clearing other selections

UX suggestions :
1. let's add a glow effect to the tags that can be reached in preview mode
2. I like the double escape action a lot, so yes, good point
3. in preview mode with only one matching tag, that tag would be focused, so pressing enter would select it and exit. This would make tab redundant
4. visual feedback has been covered (all tags darkened + red prefix)