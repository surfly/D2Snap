function validateParam(param: number, allowInfinity: boolean = false) {
    if(allowInfinity && param === Infinity) return;

    if(param < 0 || param > 1) {
        throw new RangeError(`Invalid parameter ${param}, expects value in [0, 1]`);
    }
}


export async function validateD2Snap(k: number = 0.4, l: number = 0.5, m: number = 0.6) {
    validateParam(k, true);
    validateParam(l);
    validateParam(m);
}