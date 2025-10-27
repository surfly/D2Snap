export function resolveDocument(dom: Document | HTMLElement): Document | null {
    let doc: Node | Document | null;
    try {
        let doc: Node | Document | null = (window ?? {}).document;
        if(doc) return doc as Document;
    } catch { /**/ }

    doc = dom;
    while(doc) {
        if(!!doc["createTreeWalker"]) return doc as Document;

        doc = doc?.parentNode;
    }

    return null;
}

export function resolveRoot(dom: Document | HTMLElement): HTMLElement {
    return dom["outerHTML"]
        ? (dom as HTMLElement)
        : (dom as Document)?.documentElement;
}

export async function traverseDom<T>(
    doc: Document,
    root: HTMLElement,
    filter: number = NodeFilter.SHOW_ALL,
    cb: (node: T) => void
) {
    doc = resolveDocument(doc);

    const walker = doc.createTreeWalker(root, filter);

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