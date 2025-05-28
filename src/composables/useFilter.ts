import {ref} from "vue";
import { emitter } from '../services/events';

export const useFilter = () => {
    const selectedTags = ref<string[]>([]);
    const searchText = ref<string>('');

    emitter.on('filter:tags', (newTags) => {
        selectedTags.value = newTags;
    });

    emitter.on('filter:search', (newSearchText) => {
        searchText.value = newSearchText;
    });

    emitter.on('filter:reset', () => {
        selectedTags.value = [];
        searchText.value = '';
        // Re-emit to ensure all listeners are updated
        emitter.emit('filter:tags', []);
        emitter.emit('filter:search', '');
    });

    return {
        selectedTags,
        searchText
    }
};