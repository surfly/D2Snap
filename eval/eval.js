import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { OpenAIAdapter, AnthropicAdapter } from "./Adapter.js";


const RAW_ARGS = [ undefined, ...process.argv.slice(2) ];
const parseFlag = arg => !!~RAW_ARGS.indexOf(arg);
const parseOption = arg => RAW_ARGS[RAW_ARGS.indexOf(arg) + 1];

const RESULTS_DIR_PATH = join(import.meta.dirname, "results");
const DATASET = loadDataset();
const REFERENCE = await loadReference();
const { API_ADAPTER, PROVIDER, MODEL } = (() => {
    const provider = parseOption("--provider") ?? "openai";

    let model, adapter;
    switch(provider) {
        case "openai":
            model = parseOption("--model") ?? "gpt-4o";
            adapter = new OpenAIAdapter(
                model,
                process.env.OPENAI_API_KEY
            );

            break;
        case "anthropic":
            model = parseOption("--model") ?? "claude-3-7-sonnet-latest";
            adapter = new AnthropicAdapter(
                model,
                process.env.ANTHROPIC_API_KEY
            );

            break;
        default:
            throw new SyntaxError("Specify a valid model provider");
    }

    return {
        API_ADAPTER: adapter,
        PROVIDER: provider,
        MODEL: model
    }
})();


function print(message, always = false) {
    if(!always && !parseFlag("--verbose")) return;

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
    identifier,
    snapshotLoaderCb,
    resultsAnalysisCb,
    outputSchema,
    instructionsSuffix
) {
    print(`Evaluating ${identifier}...`, true);

    const t0 = Date.now();

    const results = [];

    const abbrev = (str, limit = 100) => (str.length > limit) ? `${str.slice(0, limit)}${(str.length > limit) ? "…" : ""}` : str;

    const splitSize = parseInt(parseOption("--split") ?? "0") || Infinity;
    for(let i = 0; i < Math.min(DATASET.length, splitSize); i++) {
        const record = DATASET[i];

        const snapshotData = await snapshotLoaderCb(record.id);
        const snapshotDataPrint = snapshotData.path ?? snapshotData.data.replace(/\s+/g, " ");
        print(`(${i}) ${record.url}`, true);
        print([
            record.task,
            abbrev(snapshotDataPrint, 500)
        ].join("\n"));

        const res = await API_ADAPTER.request(
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

    const resultsFilePath = join(RESULTS_DIR_PATH, identifier.replace(/(\.json)?$/i, ".json"));
    mkdirSync(RESULTS_DIR_PATH, {
        recursive: true
    });
    writeFileSync(resultsFilePath, JSON.stringify({
        endpoint: `${PROVIDER}: ${MODEL}`,
        date: new Date().toISOString(),
        results
    }, null, 2));

    print(`...done (${Math.round((Date.now() - t0) / 1000)}s).`, true);
}