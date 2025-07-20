import { workerData, parentPort } from "worker_threads";

import { runEvaluation } from "../eval.js";
import { INSTRUCTIONS_DOM, DOMInteractiveElementTarget,analyzeResultDOM } from "../eval.shared.js";

import { d2Snap, adaptiveD2Snap } from "../../dist/D2Snap.lib.js";
import { Logger } from "../Logger.js";


const D2Snap_CONFIG = {
    assignUniqueIDs: true
};
const LOGGER = new Logger("D2Snap-serialization");


export async function runWorkerEvaluation(identifier, config) {
    await runEvaluation(
        identifier,
        async (data, id) => {
            let downsampledDOMSnapshot;
            try {
                if(!config.maxTokens) {
                    downsampledDOMSnapshot = await d2Snap(data.originalDOM, config.k, config.l, config.m, D2Snap_CONFIG);
                } else {
                    downsampledDOMSnapshot = await adaptiveD2Snap(data.originalDOM, config.maxTokens, 5, D2Snap_CONFIG);
                }
            } catch {
                return null;
            }

            LOGGER.write(`${id}.${identifier}`, downsampledDOMSnapshot.serializedHtml);

            return [
                {
                    type: "text",
                    data: downsampledDOMSnapshot.serializedHtml,
                    size: downsampledDOMSnapshot.meta.snapshotSize
                }
            ];
        },
        analyzeResultDOM,
        INSTRUCTIONS_DOM,
        DOMInteractiveElementTarget
    );
}


if(workerData?.identifier) {
    runWorkerEvaluation(workerData.identifier, workerData.config);

    parentPort.postMessage(true);
}