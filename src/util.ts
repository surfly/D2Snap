import { DOM } from "./D2Snap.types";


export function findDownsamplingRoot(dom: DOM): HTMLElement {
    return dom.body ?? dom.documentElement;
}

export async function traverseDom<T>(
    dom: DOM,
    root: HTMLElement,
    filter: number = NodeFilter.SHOW_ALL,
    cb: (node: T) => void
) {
    const walker = dom.createTreeWalker(root, filter);

    const nodes: T[] = [];
    let node = walker.firstChild() as T;
    while(node) {
        nodes.push(node);

        node = walker.nextNode() as T;
    }
    while(nodes.length) {
        await cb(nodes.shift()!);
    }
}

export function formatHtml(html, indentSize = 2): string {
    const tokens = html
        .replace(/>\s+</g, "><")
        .trim()
        .split(/(<[^>]+>)/)
        .filter(token => token.trim().length);
    const indentChar = " ".repeat(indentSize);

    let indentLevel = 0;
    const formattedHtml: string[] = [];
    for(const token of tokens) {
        if(token.match(/^<\/\w/)) {
            indentLevel = Math.max(indentLevel - 1, 0);
            formattedHtml.push(indentChar.repeat(indentLevel) + token);

            continue;
        }
        if(token.match(/^<\w[^>]*[^\/]>$/)) {
            formattedHtml.push(indentChar.repeat(indentLevel) + token);
            indentLevel++;

            continue;
        }
        if(token.match(/^<[^>]+\/>$/)) {
            formattedHtml.push(indentChar.repeat(indentLevel) + token);

            continue;
        }
        if(token.match(/^<[^!]/)) {
            formattedHtml.push(indentChar.repeat(indentLevel) + token);

            continue;
        }

        formattedHtml.push(indentChar.repeat(indentLevel) + token.trim());
    }

    return formattedHtml
        .join("\n")
        .trim();
}