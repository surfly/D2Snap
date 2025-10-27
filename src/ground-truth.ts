import GROUND_TRUTH from "./ground-truth.json" with { type: "json" };


export function isElementType(type: string, tagName: string): boolean {
    return (
        GROUND_TRUTH
            .typeElement[type]
            .tagNames as string[]
    ).includes(tagName.toLowerCase());
}

export function getContainerSemantics(tagName: string): number {
    if(!tagName) return -Infinity;

    return GROUND_TRUTH
        .typeElement
        .container
        .semantics[tagName.toLowerCase()];
}

export function getAttributeSemantics(attributeName: string): number {
    if(!attributeName) return -Infinity;

    return GROUND_TRUTH
        .typeAttribute
        .semantics[attributeName.toLowerCase()];
}