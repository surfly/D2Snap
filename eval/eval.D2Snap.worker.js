import { rmSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { workerData, parentPort } from "worker_threads";

import { JSDOM } from "jsdom";
import { z } from "zod";

import { runEvaluation } from "./eval.js";
import { analyzeDOMTargets } from "./util.dom.js";

import { d2Snap, adaptiveD2Snap } from "../dist/D2Snap.lib.js";


const DOMInteractiveElementTarget = z.object({
    cssSelector: z.string()
});

const SNAPSHOT_CB = {
    "d2Snap": d2Snap,
    "adaptiveD2Snap": adaptiveD2Snap
};
const UNIQUE_ID_ATTR = "data-uid";
const D2SNAP_RESULTS_DIR = join(import.meta.dirname, "D2Snap-results");
rmSync(D2SNAP_RESULTS_DIR, {
    recursive: true,
    force: true
});
mkdirSync(D2SNAP_RESULTS_DIR, {
    force: true
});


const loadDOMRecord = async (id, d2SnapCb, name) => {
    const originalDOM = readFileSync(join(import.meta.dirname, "dataset", "dom", `${id}.html`)).toString();
    const { document } = new JSDOM(originalDOM).window;

    const walker = document.createTreeWalker(document.body ?? document, 1);
    let n = 0;
    let node = walker.firstChild();
    while(node) {
        node.setAttribute(UNIQUE_ID_ATTR, (n++).toString());

        node = walker.nextNode();
    }

    const downsampledDOMSnapshot = await d2SnapCb(document);

    writeFileSync(join(D2SNAP_RESULTS_DIR, `${id}.${name}`), downsampledDOMSnapshot.serializedHtml);

    return {
        type: "text",
        data: downsampledDOMSnapshot.serializedHtml,
        rawData: document.documentElement.outerHTML,
        size: downsampledDOMSnapshot.meta.snapshotSize,
        estimatedTokens: Math.round(downsampledDOMSnapshot.serializedHtml.length / 4)   // according to https://platform.openai.com/tokenizer
    };
};


await runEvaluation(
    workerData.identifier,
    async id => {
        return await loadDOMRecord(id, async dom => {
            return await SNAPSHOT_CB[workerData.snapshotType](dom, workerData.args[0], workerData.args[1], workerData.args[2]);
        }, workerData.identifier);
    },
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);


parentPort.postMessage(true);