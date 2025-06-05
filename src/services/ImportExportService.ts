import {useBoardStore} from '../stores/useBoardStore';
import {useKanbanStore} from '../stores/useKanbanStore';
import {generateSlug} from "../services/slug.ts";

const promptFileNames = false;

export class ImportExportService {
    private boardStore = useBoardStore();
    private kanbanStore = useKanbanStore();

    /**
     * Export current board to JSON file
     */
    async exportBoard(): Promise<void> {
        const fileName = this.requestFileName(this.kanbanStore.boardTitle ?? 'kanban-board.json');
        if (!fileName) return; // User cancelled or invalid filename

        const data = JSON.stringify({
            title: this.kanbanStore.boardTitle,
            cards: this.kanbanStore.cards
        }, null, 2);

        this.downloadFile(data, fileName);
    }

    /**
     * Export all boards to JSON file
     */
    async exportAllBoards(): Promise<void> {
        const fileName = this.requestFileName('all-kanban-boards.json');
        if (!fileName) return; // User cancelled or invalid filename

        const allBoards = this.boardStore.boards.map(board => ({
            title: board.title,
            cards: board.cards || []
        }));

        const data = JSON.stringify({boards: allBoards}, null, 2);
        this.downloadFile(data, fileName);
    }

    private requestFileName(defaultFilename: string) {
        if (promptFileNames) {
            const filename = prompt('Enter filename for export:', defaultFilename);
            if (filename === null) return null; // User cancelled
            return filename.endsWith('.json') ? filename : `${filename}.json`;
        } else {
            return defaultFilename.endsWith('.json') ? defaultFilename : `${defaultFilename}.json`;
        }
    }

    /**
     * Import single board from file
     * Creates or replaces board, then navigates to it (MainView orchestration handles the rest)
     */
    async importBoard(file: File): Promise<string | null> {
        try {
            const text = await this.readFileAsText(file);
            const data = JSON.parse(text);
            let title = data.title || 'Imported Board';
            const importedCards = data.cards || [];

            // Check if board with same title already exists
            const existingBoard = this.boardStore.boards.find(b => b.title === title);
            if (existingBoard) {
                const confirmReplace = confirm(`A board named "${title}" already exists. Do you want to replace it?`);
                if (!confirmReplace) {
                    return null; // User cancelled, do not import
                }
            }

            // Save the board (create new or replace existing) - boardStore handles slug generation
            return await this.boardStore.saveBoard({
                id: existingBoard ? existingBoard.id : generateSlug(title),
                title,
                cards: importedCards,
                lastModified: new Date()
            });

        } catch (err) {
            console.error('Import failed:', err);
            alert('Failed to import file');
            return null;
        }
    }

    /**
     * Import multiple boards from files
     * Creates/replaces boards, current board auto-refreshes if affected (via MainView orchestration)
     */
    async importMultipleBoards(files: FileList): Promise<void> {
        if (!files || files.length === 0) return;

        try {
            // First pass: analyze what will be imported and check for conflicts
            const boardsToImport: { title: string; cards: any[]; source: string }[] = [];
            const existingConflicts: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    const text = await this.readFileAsText(file);
                    const data = JSON.parse(text);

                    if (data.boards && Array.isArray(data.boards)) {
                        // Multi-board format
                        for (const boardData of data.boards) {
                            const title = boardData.title || `Imported Board ${boardsToImport.length + 1}`;
                            const cards = boardData.cards || [];
                            boardsToImport.push({title, cards, source: file.name});

                            // Check for existing board
                            if (this.boardStore.boards.find(b => b.title === title)) {
                                existingConflicts.push(title);
                            }
                        }
                    } else {
                        // Single board format
                        const title = data.title || `Imported Board ${boardsToImport.length + 1}`;
                        const cards = data.cards || [];
                        boardsToImport.push({title, cards, source: file.name});

                        // Check for existing board
                        if (this.boardStore.boards.find(b => b.title === title)) {
                            existingConflicts.push(title);
                        }
                    }
                } catch (err) {
                    // Skip invalid files silently
                }
            }

            // Show confirmation dialog
            let confirmMessage = `About to import ${boardsToImport.length} boards.`;
            if (existingConflicts.length > 0) {
                confirmMessage += `\n\nThe following ${existingConflicts.length} board(s) will be replaced:\n${existingConflicts.join(', ')}`;
            }
            confirmMessage += '\n\nDo you want to continue?';

            if (!confirm(confirmMessage)) {
                return;
            }

            // Second pass: actually import the boards
            let importedCount = 0;
            let errorCount = 0;

            for (const boardToImport of boardsToImport) {
                try {
                    await this.boardStore.saveBoard({
                        id: generateSlug(boardToImport.title),
                        title: boardToImport.title,
                        cards: boardToImport.cards,
                        lastModified: new Date()
                    });
                    importedCount++;
                } catch (err) {
                    errorCount++;
                }
            }

            await this.boardStore.refreshBoards();

            // Show summary message (board list auto-refreshes via boardStore.saveBoard)
            if (importedCount > 0) {
                const message = errorCount > 0
                    ? `Imported ${importedCount} boards successfully. ${errorCount} files failed to import.`
                    : `Imported ${importedCount} boards successfully.`;
                alert(message);
            } else {
                alert('Failed to import any boards.');
            }

        } catch (err) {
            console.error('Import all failed:', err);
            alert('Failed to import files');
        }
    }

    /**
     * Helper method to read file as text
     */
    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Helper method to download file
     */
    private downloadFile(data: string, filename: string): void {
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}

export function useImportExportService() {
    return new ImportExportService();
}