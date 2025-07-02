import { writeFileSync } from "fs";
import { join } from "path";


const EVALS = [
    "results.gui",
    "results.dom",
    "results.D2Snap.adaptive",
    "results.D2Snap.2-16-375",
    "results.D2Snap.5-8-75",
    "results.D2Snap.inf-4-1"
];


const summary = {};

await Promise.all(
    EVALS.map(async resultsFileName => {
        const resultsFilePath = join(import.meta.dirname, resultsFileName.replace(/(\.json)?$/, ".json"));
        const results = (await import(resultsFilePath, { with: { type: "json" } })).default;

        summary[resultsFileName] = {
            success: 0,
            failure: 0,
            successRate: 0.0,
            meanSnapshotSize: 0.0,
            meanEstimatedTokens: 0.0,
            meanTime: 0.0
        };
        results.forEach((result, i) => {
            const mean = (key1, key2) => {
                return ((summary[resultsFileName][key1] ?? 0) + +result[key2]) / (i + 1);
            };

            summary[resultsFileName].success += +result.success;
            summary[resultsFileName].failure += +!result.success;
            summary[resultsFileName].successRate = mean("successRate", "success");
            summary[resultsFileName].meanSnapshotSize = mean("meanSnapshotSize", "snapshotSize");
            summary[resultsFileName].meanEstimatedTokens = mean("meanEstimatedTokens", "estimatedTokens");
            summary[resultsFileName].time = mean("meanTime", "time");
        });
    });
);


writeFileSync(
    join(import.meta.dirname, "summary.json"),
    JSON.stringify(summary, null, 2)
);