import { readFileSync } from "fs";
import { join } from "path";

import { d2Snap } from "../dist/api.js";


const str = readFile("./subject.html");


function readFile(path) {
    return readFileSync(
        join(import.meta.dirname, path)
    ).toString();
}


export default function() {
    // The string-only implementation is optimistic.
    // It requires well-formed markup input.
    return d2Snap(str);
}