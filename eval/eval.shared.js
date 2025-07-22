import { z } from "zod";

import { templateInstructions, checkAgainstTrajectories } from "./eval.util.js";


export const DOMInteractiveElementTarget = z.object({
    cssSelector: z.string()
});


export const INSTRUCTIONS_DOM = templateInstructions({
    SNAPSHOT_DESCRIPTION: "You are provided with HTML, namely a serialised DOM.",
    SCHEMA_DESCRIPTION: "Target elements by shortest unique CSS selector. If the element has an assigned `data-uid` attribute, respond with only the respective data attribute selector, e.g. `[data-uid=\"21\"]`.",
    EXAMPLE_SNAPSHOT: `
\`\`\` html
<main>
    <h1>Calculator</h1>
    <input id="expression" class="field" type="text" placeholder="3 * 4">
    <button id="submit" type="button" data-uid="3">Solve</button>
    <div id="result">
        <span></span>
    </div>
\`\`\`
    `,
    EXAMPLE_RESPONSE: `
\`\`\` json
[
    {
        "elementDescription": "Field that contains the mathematical expression to be solved.",
        "cssSelector": "#expression"
    },
    {
        "elementDescription": "Button that triggers the calculation of the provided mathematical expression.",
        "cssSelector": "[data-uid=\"3\"]"
    }
]
\`\`\`
    `
});


export function analyzeResultDOM(res, trajectories, data) {
    return checkAgainstTrajectories(res, trajectories, (resElement, referenceElement) => {
        let targetElement;
        try {
            targetElement = data.originalDOM.documentElement.querySelector(resElement.cssSelector);
        } catch { /* */ }
        if(!targetElement) return false;

        const validTargetElements = [
            targetElement,
            targetElement?.parentElement,
            targetElement?.parentElement?.parentElement,
            targetElement?.parentElement?.parentElement?.parentElement,
            ...Array.from(targetElement?.parentElement?.children ?? [])
                .filter(child => child !== targetElement),
            ...(targetElement?.children ?? [])
        ]
            .filter(element => !!element);

        return validTargetElements
            .map(validTargetElement => validTargetElement.matches(referenceElement.css_selector))
            .includes(true)
    });
}