import { d2Snap as _d2Snap, adaptiveD2Snap  as _adaptiveD2Snap} from "./D2Snap";
import { DOM } from "./types";


async function dynamicizeDOM(domOrSerialisedDOM: DOM|string): DOM {
    if(typeof(domOrSerialisedDOM) !== "string") return domOrSerialisedDOM;

    try {
        const jsdom = await import("jsdom");

        const dynamicDOM = new jsdom.JSDOM(domOrSerialisedDOM);

        return dynamicDOM.window.document;
    } catch(err) {
        console.error(err);

        throw new ReferenceError("Install 'jsdom' to use D2Snap with Node.js");
    }
}

export async function d2Snap(
    domOrSerialisedDOM: DOM|string,
    ...args: Parameters<typeof _d2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _d2Snap(await dynamicizeDOM(domOrSerialisedDOM), ...args);
}

export async function adaptiveD2Snap(
    domOrSerialisedDOM: DOM|string,
    ...args: Parameters<typeof _adaptiveD2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _adaptiveD2Snap(await dynamicizeDOM(domOrSerialisedDOM), ...args);
}