import { existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";


const RESULTS_DIR_PATH = join(import.meta.dirname, "results");
if(!existsSync(RESULTS_DIR_PATH))
    throw new ReferenceError("Run evaluation first");


const summary = {};

await Promise.all(
    readdirSync(RESULTS_DIR_PATH)
        .map(async resultsFileName => {
            const resultsFilePath = join(RESULTS_DIR_PATH, resultsFileName);
            const results = (await import(resultsFilePath, { with: { type: "json" } })).default;

            summary[resultsFileName] = {
                successCases: 0,
                failureCases: 0,
                errorCases: 0,
                successRate: 0.0,
                totalSnapshotSize: 0,
                totalEstimatedTokens: 0,
                totalRTT: 0
            };
            results
                .results
                .forEach(result => {
                    summary[resultsFileName].successCases += +result.success;
                    summary[resultsFileName].failureCases += +!result.success;
                    summary[resultsFileName].errorCases += +result.error;
                    summary[resultsFileName].totalSnapshotSize += +result.snapshotSize;
                    summary[resultsFileName].totalEstimatedTokens += +result.estimatedTokens;
                    summary[resultsFileName].totalRTT += +result.rtt;
                });

            const totalCases = summary[resultsFileName].successCases + summary[resultsFileName].failureCases;

            const mean = (key) => summary[resultsFileName][key] / totalCases;

            summary[resultsFileName].successRate = mean("successCases");
            summary[resultsFileName].errorRate = mean("errorCases");
            summary[resultsFileName].meanSnapshotSize = mean("totalSnapshotSize");
            summary[resultsFileName].meanEstimatedTokens = mean("totalEstimatedTokens");
            summary[resultsFileName].meanRTT = mean("totalRTT");
        })
);


writeFileSync(
    join(import.meta.dirname, "summary.json"),
    JSON.stringify(summary, null, 2)
);