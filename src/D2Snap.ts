// Copyright (c) Dom Christie
import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm"
// --------------------------

import { TTextNode, TDepthElement, TDOM, TOptions, TSnapshot, NodeFilter, Node } from "./types.ts";
import { formatHtml, findDownsamplingRoot, traverseDom } from "./util.ts";

import CONFIG from "./config.json" with { type: "json" };
import RATING from "./rating.json" with { type: "json" };


const TURNDOWN_KEEP_TAG_NAMES = [ "A" ];
const TURNDOWN_SERVICE = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
});
TURNDOWN_SERVICE.keep(TURNDOWN_KEEP_TAG_NAMES);
TURNDOWN_SERVICE.use(turndownPluginGfm.gfm)
const KEEP_LINE_BREAK_MARK = "@@@";


function isElementType(type, elementNode: HTMLElement) {
    return RATING.typeElement[type]
        .tagNames
        .includes(elementNode.tagName.toLowerCase());
}


export async function takeSnapshot(
    dom: TDOM,
    k: number = 2, l: number = 5, m: number = 0.5,
    options: TOptions = {}
): Promise<TSnapshot> {
    const optionsWithDefaults = {
        debug: false,
        assignUniqueIDs: false,

        ...options
    }

    function snapTextNode(textNode: TTextNode, l: number) {
        if(textNode.nodeType !== Node.TEXT_NODE) return;

        // TODO: Use element innerText instead to respect only rendered text?
        textNode.textContent = textNode
            .textContent
            .trim()
            .split(/\s+/)
            .filter((_, i) => (i + 1) % l)
            .join(" ");
    }

    function snapAttributeNode(elementNode: HTMLElement, m: number) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;

        for(const attr of Array.from(elementNode.attributes)) {
            if(RATING.typeAttribute.semantics[attr.name] >= m) continue;

            elementNode.removeAttribute(attr.name);
        }
    }
    function snapElementContentNode(elementNode: HTMLElement) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("content", elementNode)) return;

        // markdown
        const markdown = TURNDOWN_SERVICE.turndown(elementNode.outerHTML);
        const markdownNodesFragment = dom
            .createRange()
            .createContextualFragment(
                markdown
                    .trim()
                    .replace(/\n|$/g, KEEP_LINE_BREAK_MARK)
            );

        elementNode
            .replaceWith(...markdownNodesFragment.childNodes);
    }


    function snapElementInteractiveNode(elementNode: HTMLElement) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("interactive", elementNode)) return;

        // pass
    }

    function snapElementContainerNode(elementNode: TDepthElement, k: number) {
        if(elementNode.nodeType !== Node.ELEMENT_NODE) return;
        if(!isElementType("container", elementNode)) return;

        // merge
        if(elementNode.depth % k === 0) return;

        const getContainerSemantics = tagName => RATING.typeElement
            .container
            .semantics[tagName.toLowerCase()];

        const elements = [
            elementNode.parentElement as TDepthElement,
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

    function snapElementNode(elementNode: HTMLElement) {
        if(isElementType("container", elementNode)) {
            (elementNode as TDepthElement).depth = ((elementNode.parentNode as TDepthElement).depth ?? -1) + 1;

            return;
        }

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


    const originalSize = dom.documentElement.outerHTML.length;
    const partialDom: HTMLElement = findDownsamplingRoot(dom);
    const virtualDom = partialDom.cloneNode(true) as HTMLElement;

    // Prepare
    await traverseDom<Comment>(
        dom,
        virtualDom,
        NodeFilter.SHOW_COMMENT,
        node => node.parentNode?.removeChild(node)
    );

    let n = 0;
    optionsWithDefaults.assignUniqueIDs
        && await traverseDom<Element>(
            dom,
            virtualDom,
            NodeFilter.SHOW_ELEMENT,
            node => {
                if(
                    ![
                        ...RATING.typeElement.container.tagNames,
                        ...RATING.typeElement.interactive.tagNames
                    ].includes(node.tagName.toLowerCase())
                ) return;

                node.setAttribute(CONFIG.uniqueIDAttribute, (n++).toString())
            }
        );

    // D2Snap implementation harnessing the power of the TreeWalkers API:

    // Attribute nodes
    await traverseDom<HTMLElement>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: HTMLElement) => snapAttributeNode(node, m)   // work on parent element
    );

    // Text nodes first
    await traverseDom<TTextNode>(
        dom,
        virtualDom,
        NodeFilter.SHOW_TEXT,
        (node: TTextNode) => snapTextNode(node, l)
    );

    // Non-container element nodes
    await traverseDom<HTMLElement>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: HTMLElement) => snapElementNode(node, k)
    );

    // Container element nodes
    await traverseDom<TDepthElement>(
        dom,
        virtualDom,
        NodeFilter.SHOW_ELEMENT,
        (node: TDepthElement) => {
            if(!isElementType("container", node)) return;

            return snapElementContainerNode(node, k);
        }
    );

    const virtualDomRoot = (k === Infinity && virtualDom.children.length)
        ? virtualDom.children[0]
        : virtualDom;

    const snapshot = virtualDomRoot.innerHTML;
    let serializedHtml = optionsWithDefaults.debug
        ? formatHtml(snapshot)
        : snapshot;
        serializedHtml = serializedHtml
        .replace(new RegExp(KEEP_LINE_BREAK_MARK, "g"), "\n")
        .replace(/\n *(\n|$)/g, "");

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