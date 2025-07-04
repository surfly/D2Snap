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
    runEvaluationInWorker("D2Snap.adaptive", "adaptiveD2Snap", 4096, 5),
    runEvaluationInWorker("D2Snap.3-3-3", "d2Snap", 0.3, 0.3, 0.3),
    runEvaluationInWorker("D2Snap.inf-4-1", "d2Snap", Infinity, 1.0, 1.0)
]);