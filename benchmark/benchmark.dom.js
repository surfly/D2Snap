import { readFileSync } from "fs";
import { join } from "path";

import { dynamicizeDOM } from "../dynamicize-dom.js";
import { d2Snap } from "../dist/api.js";


const DOM = await readFileAsDOM("./subject.html");


async function readFileAsDOM(path) {
    return (await dynamicizeDOM(
        readFileSync(
            join(import.meta.dirname, path)
        ).toString()
    ));
}


export default async function() {
    return d2Snap(DOM);
}