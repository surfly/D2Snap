import { d2Snap as _d2Snap, adaptiveD2Snap  as _adaptiveD2Snap} from "./D2Snap";


declare global {
    interface Window {
        D2Snap: any;
    }
}


window.D2Snap = {};

window.D2Snap.d2Snap = function(
    ...args: Parameters<typeof _d2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _d2Snap(document, ...args);
}

window.D2Snap.adaptiveD2Snap = function(
    ...args: Parameters<typeof _adaptiveD2Snap> extends [ unknown, ...infer T ] ? T : never
) {
    return _adaptiveD2Snap(document, ...args);
}