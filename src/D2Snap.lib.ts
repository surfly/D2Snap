import { takeSnapshot as _takeSnapshot, takeAdaptiveSnapshot  as _takeAdaptiveSnapshot} from "./D2Snap";
import { TDOM } from "./types";

import { JSDOM } from "jsdom";


function dynamicizeDOM(serialisedDOM: string): TDOM {
    const syntheticDOM = new JSDOM(serialisedDOM);

    return syntheticDOM.window.document;
}

export function takeSnapshot(
    serialisedDOM: string,
    ...args: Parameters<typeof _takeSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeSnapshot(dynamicizeDOM(serialisedDOM), ...args);
}

export function takeAdaptiveSnapshot(
    serialisedDOM: string,
    ...args: Parameters<typeof _takeAdaptiveSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeAdaptiveSnapshot(dynamicizeDOM(serialisedDOM), ...args);
}