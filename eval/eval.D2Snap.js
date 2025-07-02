import { Worker } from "worker_threads";
import { join } from "path";


function runEvaluationInWorker(identifier, snapshotType, ...args) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(join(import.meta.dirname, "eval.D2Snap.worker.js"), {
            argv: process.argv,
            workerData: {
                identifier,
                snapshotType,
                args
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


await Promise.all([
    runEvaluationInWorker("D2Snap.adaptive", "takeAdaptiveSnapshot", 4096, 5),
    runEvaluationInWorker("D2Snap.2-6-375", "takeSnapshot", 2, 6, 0.375),
    runEvaluationInWorker("D2Snap.5-8-75", "takeSnapshot", 5, 8, 0.75),
    runEvaluationInWorker("D2Snap.inf-4-1", "takeSnapshot", Infinity, 4, 1.0)
]);