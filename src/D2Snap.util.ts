import { D2SnapOptions } from "./types";


export async function validateParams(k: number, l: number, m: number) {
    const validateParam = (param: number, allowInfinity: boolean = false) => {
        if(allowInfinity && param === Infinity) return;

        if(param < 0 || param > 1) {
            throw new RangeError(`Invalid parameter ${param}, expects value in [0, 1]`);
        }
    };

    validateParam(k, true);
    validateParam(l);
    validateParam(m);
}

export function getOptionsWithDefaults<
    O extends string | number | symbol = ""
>(
    options: Partial<D2SnapOptions>
): Omit<D2SnapOptions, O> {
    return {
        assignUniqueIDs: false,
        debug: false,
        keepUnknownElements: false,

        ...options
    }
}