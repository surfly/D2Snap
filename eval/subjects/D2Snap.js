import { Worker } from "worker_threads";
import { join } from "path";

import { parseOption } from "../eval.util.js";


const EVALS = {
    "D2Snap.1-1-1": { k: 0.1, l: 0.1, m: 0.1 },
    "D2Snap.4-4-4": { k: 0.5, l: 0.5, m: 0.5 },
    "D2Snap.lin": { k: Infinity, l: 0, m: 1 },
    "D2Snap.9-3-6": { k: 0.9, l: 0.3, m: 0.6 },
    "D2Snap.6-9-3": { k: 0.6, l: 0.9, m: 0.3 },
    "D2Snap.3-6-9": { k: 0.3, l: 0.6, m: 0.9 },
    "D2Snap.ada.4096": { maxTokens: 4096 },
    "D2Snap.ada.8192": { maxTokens: 8192 },
    "D2Snap.ada.32768": { maxTokens: 32768 }
};


function runEvaluationInWorker(identifier, config) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(join(import.meta.dirname, "D2Snap.worker.js"), {
            argv: process.argv,
            workerData: {
                identifier,
                config
            }
        });

        worker.on("message", resolve);
        worker.on("error", reject);
        worker.on("exit", code => {
            code
                ? reject(new Error(`Worker stopped with exit code ${code}`))
                : resolve();
        });
    });
}


const singleConfig = parseOption("--config");
if(singleConfig) {
    const ev = EVALS[singleConfig];
    if(!ev) throw new ReferenceError("Undefined configuration");

    await runEvaluationInWorker(singleConfig, ev);
} else {
    await Promise.all(
        Object.entries(EVALS)
            .map(ev => {
                return runEvaluationInWorker.apply(null, ev);
            })
    );
}