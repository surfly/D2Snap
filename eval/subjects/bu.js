import { z } from "zod";

import { runEvaluation } from "../eval.js";
import { templateInstructions, checkAgainstTrajectories } from "../eval.util.js";


const BUInteractiveElementTarget = z.object({
    numericalIdentifier: z.number()
});


const baseInstructionsBU = {
    EXAMPLE_RESPONSE: `
\`\`\` json
[
    {
        "elementDescription": "Field that contains the mathematical expression to be solved.",
        "identifier": 0
    },
    {
        "elementDescription": "Button that triggers the calculation of the provided mathematical expression.",
        "identifier": 1
    }
]
\`\`\`        
    `
};


function analyzeResultBU(res, trajectories) {
    return checkAgainstTrajectories(res, trajectories, (resElement, referenceElement) => {
        return (resElement.numericalIdentifier === referenceElement.bu_identifier);
    });
}

runEvaluation(
    "bu",
    (data) => {
        return [
            {
                type: "image",
                data: data.buGUI.data,
                path: data.buGUI.path,
                size: Buffer.byteLength(data.buGUI.data)
            },
            {
                type: "text",
                data: data.buTxt,
                size: data.buTxt.length
            }
        ];
    },
    analyzeResultBU,
    templateInstructions({
        ...baseInstructionsBU,

        SNAPSHOT_DESCRIPTION: `
You are provided with two means of input:

1. A screenshot of the browser with bounding boxes and related numeric identifiers.
2. A list of interactive elements with format \`[index] type "text"\`. \`index\` is the numeric identifier, \`type\` is an HTML element type (button, input, etc.), and \`text\` is the element description.

> Numeric identifiers across means of input are consistent.
        `,
        SCHEMA_DESCRIPTION: "Target elements by their numeric identifiers as given across both means of input.",
        EXAMPLE_SNAPSHOT: `
\`\`\` base64
data:image/png;base64,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
\`\`\`

\`\`\` html
[0] INPUT "Type expression"
[1] BUTTON "Solve"
[2] A ""
\`\`\`
        `
    }),
    BUInteractiveElementTarget
);

runEvaluation(
    "bu.min",
    (data) => {
        return [
            {
                type: "text",
                data: data.buTxt,
                size: data.buTxt.length
            }
        ];
    },
    analyzeResultBU,
    templateInstructions({
        ...baseInstructionsBU,

        SNAPSHOT_DESCRIPTION: `
You are provided with a list of interactive elements with format \`[index] type "text"\`. \`index\` is the numeric identifier, \`type\` is an HTML element type (button, input, etc.), and \`text\` is the element description.
        `,
        SCHEMA_DESCRIPTION: "Target elements by their numeric identifiers as given with input.",
        EXAMPLE_SNAPSHOT: `
\`\`\` html
[0] INPUT "Type expression"
[1] BUTTON "Solve"
[2] A ""
\`\`\`
        `
    }),
    BUInteractiveElementTarget
);