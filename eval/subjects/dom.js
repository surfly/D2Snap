import { runEvaluation } from "../eval.js";
import { INSTRUCTIONS_DOM, DOMInteractiveElementTarget, analyzeResultDOM } from "../eval.shared.js";


const MAX_SNAPSHOT_SIZE_B = 2**13 * 4;  // according to https://platform.openai.com/tokenizer


// NOTE: Cut-off at 'maximum' context length
runEvaluation(
    "dom",
    async (data) => {
        const domSnapshot = data.originalDOM
            .documentElement
            .outerHTML
            .split(/<\/head>/i)
            .pop()
            .slice(0, MAX_SNAPSHOT_SIZE_B);

        return [
            {
                type: "text",
                data: domSnapshot,
                size: domSnapshot.length
            }
        ];
    },
    analyzeResultDOM,
    INSTRUCTIONS_DOM,
    DOMInteractiveElementTarget
);