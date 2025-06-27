import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { OpenAIAdapter } from "./Adapter.js";


const RAW_ARGS = [ undefined, ...process.argv.slice(2) ];
const parseFlag = arg => !!~RAW_ARGS.indexOf(arg);
const parseOption = arg => RAW_ARGS[RAW_ARGS.indexOf(arg) + 1];
const ARGS = {
    model: parseOption("--model") ?? "gpt-4.1",
    splitSize: parseInt(parseOption("--split") ?? "0") || Infinity,
    verbose: parseFlag("--verbose")
};
const DATASET = loadDataset();
const REFERENCE = await loadReference();
const OPENAI_ADAPTER = new OpenAIAdapter(ARGS.model, process.env.OPENAI_API_KEY);


function print(message, always = false) {
    if(!always && !ARGS.verbose) return;

    console.log(`\x1b[2m${message}\x1b[0m`);
}

function loadInstructions(name = "prefix") {
    return readFileSync(join(import.meta.dirname, "dataset", `instructions.${name}.md`)).toString();
}

function loadDataset() {
    const raw = readFileSync(join(import.meta.dirname, "dataset", "data.jsonl")).toString();
    return raw
        .split(/\n/g)
        .map(record => record.trim())
        .filter(record => !!record)
        .map(record => JSON.parse(record));
}

async function loadReference() {
    const reference = (await import(join(import.meta.dirname, "dataset", "reference.json"), { with: { type: "json" } })).default;
    return new Map(
        reference
            .map(record => [ record.id, record ])
    );
}


export async function runEvaluation(
    resultsFileName,
    snapshotLoaderCb,
    resultsAnalysisCb,
    outputSchema,
    instructionsSuffix
) {
    print("Evaluating...", true);
    const t0 = Date.now();

    const results = [];

    const abbrev = (str, limit = 100) => (str.length > limit) ? `${str.slice(0, limit)}${(str.length > limit) ? "…" : ""}` : str;

    for(let i = 0; i < Math.min(DATASET.length, ARGS.splitSize); i++) {
        const record = DATASET[i];

        const snapshotData = await snapshotLoaderCb(record.id);
        const snapshotDataPrint = snapshotData.data.replace(/\s+/g, " ")
        print(`(${i}) ${record.url}`, true);
        print([
            record.task,
            abbrev(snapshotDataPrint, 500)
        ].join("\n"));

        const res = await OPENAI_ADAPTER.request(
            [
                loadInstructions()
            ].concat(
                instructionsSuffix
                    ? [ loadInstructions(`suffix.${instructionsSuffix}`) ]
                    : []
            ),
            record.task,
            snapshotData,
            outputSchema
        );

        const autoAnalysisWasSuccessful = await resultsAnalysisCb(
            res.interactiveElements,
            REFERENCE.get(record.id),
            snapshotData.data,
            snapshotData.rawData
        );
        const result = {
            id: record.id,
            snapshotSize: snapshotData.size,
            estimatedTokens: snapshotData.estimatedTokens,
            response: res.interactiveElements,
            success: autoAnalysisWasSuccessful
        };

        results.push(result);
    }

    const resultsFilePath = join(import.meta.dirname, resultsFileName.replace(/(\.json)?$/i, ".json"));

    writeFileSync(resultsFilePath, JSON.stringify(results, null, 2));

    print(`...done (${Math.round((Date.now() - t0) / 1000)}s).`, true);
}