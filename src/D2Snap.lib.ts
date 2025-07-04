import { d2Snap as _d2Snap, adaptiveD2Snap  as _adaptiveD2Snap} from "./D2Snap";
import { DOM } from "./types";

import { JSDOM } from "jsdom";


function dynamicizeDOM(domOrSerialisedDOM: DOM|string): DOM {
    if(typeof(domOrSerialisedDOM) !== "string") return domOrSerialisedDOM;

    const dynamicDOM = new JSDOM(domOrSerialisedDOM);

    return dynamicDOM.window.document;
}

export function d2Snap(
    domOrSerialisedDOM: DOM|string,
    ...args: Parameters<typeof _d2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _d2Snap(dynamicizeDOM(domOrSerialisedDOM), ...args);
}

export function adaptiveD2Snap(
    domOrSerialisedDOM: DOM|string,
    ...args: Parameters<typeof _adaptiveD2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _adaptiveD2Snap(dynamicizeDOM(domOrSerialisedDOM), ...args);
}