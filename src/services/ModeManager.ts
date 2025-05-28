import { emitter } from './events';
import { Modes } from '../types';

class ModeManager {
    private currentMode: Modes = 'navigation';

    constructor() {
        emitter.on('mode:enter', (mode?: Modes) => {
            this.enterMode(mode);
        });

        emitter.on('mode:exit', () => {
            this.exitMode();
        });
    }

    getCurrentMode(): Modes {
        return this.currentMode;
    }

    private enterMode(mode?: Modes) {
        const newMode = mode ?? 'navigation';
        if (this.currentMode === newMode) return;

        this.currentMode = newMode;
    }

    private exitMode() {
        if (this.currentMode === 'navigation') return;
        
        this.currentMode = 'navigation';
        
        // Notify that we're entering navigation mode
        emitter.emit('mode:enter', 'navigation');
    }
}

// Singleton instance
let modeManagerInstance: ModeManager | null = null;

export function useModeManager(): ModeManager {
    if (!modeManagerInstance) {
        modeManagerInstance = new ModeManager();
    }
    return modeManagerInstance;
}