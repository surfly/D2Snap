import { takeSnapshot as _takeSnapshot, takeAdaptiveSnapshot  as _takeAdaptiveSnapshot} from "./D2Snap";
import { TDOM } from "./types";

import { JSDOM } from "jsdom";


function dynamicizeDOM(domOrSerialisedDOM: TDOM|string): TDOM {
    if(typeof(domOrSerialisedDOM) !== "string") return domOrSerialisedDOM;

    const dynamicDOM = new JSDOM(domOrSerialisedDOM);

    return dynamicDOM.window.document;
}

export function takeSnapshot(
    domOrSerialisedDOM: TDOM|string,
    ...args: Parameters<typeof _takeSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeSnapshot(dynamicizeDOM(domOrSerialisedDOM), ...args);
}

export function takeAdaptiveSnapshot(
    domOrSerialisedDOM: TDOM|string,
    ...args: Parameters<typeof _takeAdaptiveSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeAdaptiveSnapshot(dynamicizeDOM(domOrSerialisedDOM), ...args);
}