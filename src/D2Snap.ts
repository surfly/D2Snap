// ------------------------------------------
// Copyright (c) Thassilo M. Schiepanski
// ------------------------------------------


import { TextNode, HTMLElementDepth, DOM, D2SnapOptions, Snapshot, NodeFilter, Node } from "./D2Snap.types.ts";
import { formatHtml, findDownsamplingRoot, traverseDom } from "./util.ts";
import { relativeTextRank } from "./TextRank.ts";
import { KEEP_LINE_BREAK_MARK, turndown } from "./Turndown.ts";

import CONFIG from "./config.json" with { type: "json" };
import RATING from "./rating.json" with { type: "json" };


function checkParam(param: number, allowInfinity: boolean = false) {
    if(allowInfinity && param === Infinity) return;

    if(param < 0 || param > 1)
            throw new RangeError(`Invalid parameter ${param}, expects value in [0, 1]`);
}

function isElementType(type, elementNode: HTMLElement) {
    return RATING.typeElement[type]
        .tagNames
        .includes(elementNode.tagName.toLowerCase());
}


export async function d2Snap(
    dom: DOM,
    k: number = 0.4, l: number = 0.5, m: number = 0.6,
    options: D2SnapOptions = {}
): Promise<Snapshot> {
    checkParam(k, true);
    checkParam(l);
    checkParam(m);

    const optionsWithDefaults = {
        debug: false,
        assignUniqueIDs: false,

        ...options
    }

    function snapElementNode(elementNode: HTMLElement) {
        if(isElementType("container", elementNode)) return;

        if(isElementType("content", elementNode)) {
            return snapElementContentNode(elementNode);
        }
        if(isElementType("interactive", elementNode)) {
            snapElementInteractiveNode(elementNode);

            return;
        }

        elementNode
            .parentNode
            ?.removeChild(elementNode);
    }

    function snapElementContainerNode(elementNode: HTMLElementDepth, k: number, domTreeHeight: number) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("container", elementNode)) return;

        // merge
        const mergeLevels: number = Math.max(
            Math.round(domTreeHeight * (Math.min(1, k))),
            1
        );
        if((elementNode.depth - 1) % mergeLevels === 0) return;

        const getContainerSemantics = tagName => RATING.typeElement
            .container
            .semantics[tagName.toLowerCase()];

        const elements = [
            elementNode.parentElement as HTMLElementDepth,
            elementNode
        ];

        const mergeUpwards = (
                getContainerSemantics(elements[0].tagName)
            >= getContainerSemantics(elements[1].tagName)
        );
        !mergeUpwards && elements.reverse();

        const targetEl = elements[0];
        const sourceEl = elements[1];

        const mergedAttributes = Array.from(targetEl.attributes);
        for(const attr of sourceEl.attributes) {
            if(mergedAttributes.some(targetAttr => targetAttr.name === attr.name)) continue;
            mergedAttributes.push(attr);
        }
        for(const attr of targetEl.attributes) {
            targetEl.removeAttribute(attr.name);
        }
        for(const attr of mergedAttributes) {
            targetEl.setAttribute(attr.name, attr.value);
        }

        if(mergeUpwards) {
            while(sourceEl.childNodes.length) {
                targetEl
                    .insertBefore(sourceEl.childNodes[0], sourceEl);
            }
        } else {
            let afterPivot = false;
            while(sourceEl.childNodes.length > 1) {
                const childNode = sourceEl.childNodes[+afterPivot];

                if(childNode === targetEl) {
                    afterPivot = true;

                    continue;
                }

                (afterPivot || !targetEl.childNodes.length)
                    ? targetEl
                        .appendChild(childNode)
                    : targetEl
                        .insertBefore(childNode, targetEl.childNodes[0]);
            }

            targetEl.depth = sourceEl.depth!;

            sourceEl
                .parentNode
                ?.insertBefore(targetEl, sourceEl);
        }

        sourceEl
            .parentNode
            ?.removeChild(sourceEl);
    }

    function snapElementContentNode(elementNode: HTMLElement) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("content", elementNode)) return;

        // markdown
        const markdown = turndown(elementNode.outerHTML);
        const markdownNodesFragment = dom
            .createRange()
            .createContextualFragment(markdown);

        elementNode
            .replaceWith(...markdownNodesFragment.childNodes);
    }

    function snapElementInteractiveNode(elementNode: HTMLElement) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("interactive", elementNode)) return;

        // pass
    }

    function snapTextNode(textNode: TextNode, l: number) {
        if(textNode.nodeType !== Node.TEXT_NODE) return;

        const text: string = (textNode?.innerText ?? textNode.textContent);

        textNode.textContent = relativeTextRank(text, (1 - l));
    }

    function snapAttributeNode(elementNode: HTMLElement, m: number) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;

        for(const attr of Array.from(elementNode.attributes)) {
            if(RATING.typeAttribute.semantics[attr.name] >= m) continue;

            elementNode.removeAttribute(attr.name);
        }
    }

    const originalSize = dom.documentElement.outerHTML.length;
    const partialDom: HTMLElement = findDownsamplingRoot(dom);

    let n = 0;
    optionsWithDefaults.assignUniqueIDs
        && await traverseDom<Element>(
            dom,
            partialDom,
            NodeFilter.SHOW_ELEMENT,
            elementNode => {
                if(
                    ![
                        ...RATING.typeElement.container.tagNames,
                        ...RATING.typeElement.interactive.tagNames
                    ]
                        .includes(elementNode.tagName.toLowerCase())
                ) return;

                elementNode.setAttribute(CONFIG.uniqueIDAttribute, (n++).toString());
            }
        );

    const virtualDom = partialDom.cloneNode(true) as HTMLElement;

    let domTreeHeight: number = 0;
    await traverseDom<Element>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        elementNode => {
            const depth: number = ((elementNode.parentNode as HTMLElementDepth).depth ?? 0) + 1;

            (elementNode as HTMLElementDepth).depth = depth;

            domTreeHeight = Math.max(depth, domTreeHeight);
        }
    );

    // Prepare
    await traverseDom<Comment>(
        dom,
        virtualDom,
        NodeFilter.SHOW_COMMENT,
        node => node.parentNode?.removeChild(node)
    );

    // D2Snap implementation harnessing the power of the TreeWalkers API:

    // Text nodes first
    await traverseDom<TextNode>(
        dom,
        virtualDom,
        NodeFilter.SHOW_TEXT,
        (node: TextNode) => snapTextNode(node, l)
    );

    // Non-container element nodes
    await traverseDom<HTMLElement>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: HTMLElement) => snapElementNode(node)
    );

    // Container element nodes
    await traverseDom<HTMLElementDepth>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: HTMLElementDepth) => {
            if(!isElementType("container", node)) return;

            return snapElementContainerNode(node, k, domTreeHeight);
        }
    );

    // Attribute nodes
    await traverseDom<HTMLElement>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: HTMLElement) => snapAttributeNode(node, m)   // work on parent element
    );

    const snapshot = virtualDom.innerHTML;
    let serializedHtml = optionsWithDefaults.debug
        ? formatHtml(snapshot)
        : snapshot;
        serializedHtml = serializedHtml
        .replace(new RegExp(KEEP_LINE_BREAK_MARK, "g"), "\n")
        .replace(/\n *(\n|$)/g, "");
        serializedHtml = (k === Infinity && virtualDom.children.length)
        ? serializedHtml
            .trim()
            .replace(/^<[^>]+>\s*/, "")
            .replace(/\s*<\/[^<]+>$/, "")
        : serializedHtml;

    return {
        serializedHtml,
        meta: {
            originalSize,
            snapshotSize: snapshot.length,
            sizeRatio: snapshot.length / originalSize,
            estimatedTokens: Math.round(snapshot.length / 4)    // according to https://platform.openai.com/tokenizer
        }
    };
}

export async function adaptiveD2Snap(
    dom: DOM,
    maxTokens: number = 4096,
    maxIterations: number = 5,
    options: D2SnapOptions = {}
): Promise<Snapshot & {
    parameters: {
        k: number; l: number; m: number;
        adaptiveIterations: number;
    }
}> {
    const S = findDownsamplingRoot(dom).outerHTML.length;
    const M = 1e6;

    function* generateHalton() {
        const halton = (index: number, base: number) => {
            let result: number = 0;
            let f: number = 1 / base;
            let i: number = index;
            while(i > 0) {
                result += f * (i % base);
                i = Math.floor(i / base);
                f /= base;
            }
            return result;
        };

        let i = 0;
        while(true) {
            i++;

            yield [
                halton(i, 2),
                halton(i, 3),
                halton(i, 5)
            ];
        }
    }


    let i = 0;
    let sCalc = S;
    let parameters, snapshot;
    const haltonGenerator = generateHalton();
    while(true) {
        const haltonPoint = haltonGenerator.next().value;

        const computeParam = (haltonValue: number) => Math.min((sCalc / M) * haltonValue, 1);

        parameters = {
            k: computeParam(haltonPoint[0]),
            l: computeParam(haltonPoint[1]),
            m: computeParam(haltonPoint[2])
        };
        snapshot = await d2Snap(dom, parameters.k, parameters.l, parameters.m, options);
        sCalc = sCalc**1.125;   // stretch

        if(snapshot.meta.estimatedTokens <= maxTokens)
            break;

        if(i++ === maxIterations)
            throw new RangeError("Unable to create snapshot below given token threshold");
    }

    return {
        ...snapshot,

        parameters: {
            ...parameters,

            adaptiveIterations: i
        }
    };
}