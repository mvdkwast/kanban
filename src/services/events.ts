import { Modes } from '../types';
import mitt from "mitt";

export type Events = {
    'mode:enter'?: Modes,
    'mode:exit': Modes,

    'tags:updated': string[],

    'filter:tags': string[];
    'filter:search': string;
    'filter:reset': void;
    
    // Global keyboard shortcuts
    'global:toggleHelp': void;
    'global:export': void;
    'global:import': void;
    'global:newBoard': void;
    'global:focusTitle': void;
    'global:prevBoard': void;
    'global:nextBoard': void;
    
    // Card events
    'card:completed': string;
}

export const emitter = mitt<Events>();