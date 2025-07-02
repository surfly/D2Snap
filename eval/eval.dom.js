import { readFileSync } from "fs";
import { join } from "path";

import { z } from "zod";

import { runEvaluation } from "./eval.js";
import { analyzeDOMTargets } from "./util.dom.js";


const DOMInteractiveElementTarget = z.object({
    cssSelector: z.string()
});

const MAX_SNAPSHOT_SIZE_B = 2**13;


// NOTE: Cut-off at maximum context length
runEvaluation(
    "dom",
    async (id) => {
        const rawDOMSnapshot = readFileSync(join(import.meta.dirname, "dataset", "dom", `${id}.html`)).toString();
        const domSnapshot = rawDOMSnapshot.slice(0, MAX_SNAPSHOT_SIZE_B);

        return {
            type: "text",
            data: domSnapshot,
            rawData: rawDOMSnapshot,
            size: domSnapshot.length,
            estimatedTokens: Math.round(domSnapshot.length / 4) // according to https://platform.openai.com/tokenizer
        };
    },
    analyzeDOMTargets,
    DOMInteractiveElementTarget,
    "dom"
);