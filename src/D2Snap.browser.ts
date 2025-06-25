import { takeSnapshot as _takeSnapshot, takeAdaptiveSnapshot  as _takeAdaptiveSnapshot} from "./D2Snap";


declare global {
    interface Window {
        D2Snap: any;
    }
}


window.D2Snap = {};

window.D2Snap.takeSnapshot = function(
    ...args: Parameters<typeof _takeSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeSnapshot(document, ...args);
}

window.D2Snap.takeAdaptiveSnapshot = function(
    ...args: Parameters<typeof _takeAdaptiveSnapshot> extends [ unknown, ...infer T ] ? T : never
) {
    return _takeAdaptiveSnapshot(document, ...args);
}