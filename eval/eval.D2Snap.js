import { rmSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { z } from "zod";

import { runEvaluation } from "./eval.js";
import { analyzeDOMTargets } from "./util.dom.js";

import { takeAdaptiveSnapshot, takeSnapshot } from "../dist/D2Snap.lib.js";


const DOMInteractiveElementTarget = z.object({
    cssSelector: z.string()
});

const D2SNAP_RESULTS_DIR = join(import.meta.dirname, "D2Snap-results");
rmSync(D2SNAP_RESULTS_DIR, {
    recursive: true,
    force: true
});
mkdirSync(D2SNAP_RESULTS_DIR);


const loadDOMRecord = async (id, takeSnapshotCb, name) => {
    const rawDOMSnapshot = readFileSync(join(import.meta.dirname, "dataset", "dom", `${id}.html`)).toString();
    const downsampledDOMSnapshot = await takeSnapshotCb(rawDOMSnapshot);

    writeFileSync(join(D2SNAP_RESULTS_DIR, `${id}.${name}`), downsampledDOMSnapshot.serializedHtml);

    return {
        type: "text",
        data: downsampledDOMSnapshot.serializedHtml,
        rawData: rawDOMSnapshot,
        size: downsampledDOMSnapshot.meta.snapshotSize,
        estimatedTokens: Math.round(downsampledDOMSnapshot.serializedHtml.length / 4)   // according to https://platform.openai.com/tokenizer
    };
};


await runEvaluation(
    "results.D2Snap.adaptive",
    async id => loadDOMRecord(id, dom => takeAdaptiveSnapshot(dom, 4096, 5, {
        assignUniqueIDs: true
    }), "results.D2Snap.adaptive"),
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);

await runEvaluation(
    "results.D2Snap.2-6-375",
    async id => loadDOMRecord(id, dom => takeSnapshot(dom, 2, 6, 0.375, {
        assignUniqueIDs: true
    }), "results.D2Snap.2-6-375"),
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);

await runEvaluation(
    "results.D2Snap.5-8-75",
    async id => loadDOMRecord(id, dom => takeSnapshot(dom, 5, 8, 0.75, {
        assignUniqueIDs: true
    }), "results.D2Snap.5-8-75"),
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);

await runEvaluation(
    "results.D2Snap.inf-4-1",
    async id => loadDOMRecord(id, dom => takeSnapshot(dom, Infinity, 4, 1.0, {
        assignUniqueIDs: true
    }), "results.D2Snap.inf-4-1"),
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);