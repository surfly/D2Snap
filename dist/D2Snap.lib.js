// src/D2Snap.ts
import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm";

// src/util.ts
function findDownsamplingRoot(dom) {
  return dom.body ?? dom.documentElement;
}
async function traverseDom(dom, root, filter = NodeFilter.SHOW_ALL, cb) {
  const walker = dom.createTreeWalker(root, filter);
  const nodes = [];
  let node = walker.firstChild();
  while (node) {
    nodes.push(node);
    node = walker.nextNode();
  }
  while (nodes.length) {
    await cb(nodes.shift());
  }
}
function formatHtml(html, indentSize = 2) {
  const tokens = html.replace(/>\s+</g, "><").trim().split(/(<[^>]+>)/).filter((token) => token.trim().length);
  const indentChar = " ".repeat(indentSize);
  let indentLevel = 0;
  const formattedHtml = [];
  for (const token of tokens) {
    if (token.match(/^<\/\w/)) {
      indentLevel = Math.max(indentLevel - 1, 0);
      formattedHtml.push(indentChar.repeat(indentLevel) + token);
      continue;
    }
    if (token.match(/^<\w[^>]*[^\/]>$/)) {
      formattedHtml.push(indentChar.repeat(indentLevel) + token);
      indentLevel++;
      continue;
    }
    if (token.match(/^<[^>]+\/>$/)) {
      formattedHtml.push(indentChar.repeat(indentLevel) + token);
      continue;
    }
    if (token.match(/^<[^!]/)) {
      formattedHtml.push(indentChar.repeat(indentLevel) + token);
      continue;
    }
    formattedHtml.push(indentChar.repeat(indentLevel) + token.trim());
  }
  return formattedHtml.join("\n").trim();
}

// src/config.json
var config_default = {
  uniqueIDAttribute: "data-uid"
};

// src/rating.json
var rating_default = {
  typeElement: {
    container: {
      tagNames: [
        "article",
        "aside",
        "body",
        "div",
        "footer",
        "header",
        "main",
        "nav",
        "section"
      ],
      semantics: {
        article: 0.95,
        aside: 0.85,
        body: 0.9,
        div: 0.3,
        footer: 0.7,
        header: 0.75,
        main: 0.85,
        nav: 0.8,
        section: 0.9
      }
    },
    interactive: {
      tagNames: [
        "a",
        "button",
        "details",
        "form",
        "input",
        "label",
        "select",
        "summary",
        "textarea"
      ]
    },
    content: {
      tagNames: [
        "address",
        "blockquote",
        "b",
        "code",
        "em",
        "figure",
        "figcaption",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "img",
        "li",
        "ol",
        "p",
        "pre",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "table",
        "tbody",
        "td",
        "thead",
        "th",
        "tr",
        "ul"
      ],
      skipTagNames: [
        "li",
        "tbody",
        "td",
        "thead",
        "tr"
      ]
    }
  },
  typeAttribute: {
    semantics: {
      alt: 0.9,
      href: 0.9,
      src: 0.8,
      id: 0.8,
      class: 0.7,
      title: 0.6,
      lang: 0.6,
      role: 0.6,
      "aria-*": 0.6,
      placeholder: 0.5,
      label: 0.5,
      for: 0.5,
      value: 0.5,
      checked: 0.5,
      disabled: 0.5,
      readonly: 0.5,
      required: 0.5,
      maxlength: 0.5,
      minlength: 0.5,
      pattern: 0.5,
      step: 0.5,
      min: 0.5,
      max: 0.5,
      accept: 0.4,
      "accept-charset": 0.4,
      action: 0.4,
      method: 0.4,
      enctype: 0.4,
      target: 0.4,
      rel: 0.4,
      media: 0.4,
      sizes: 0.4,
      srcset: 0.4,
      preload: 0.4,
      autoplay: 0.4,
      controls: 0.4,
      loop: 0.4,
      muted: 0.4,
      poster: 0.4,
      autofocus: 0.3,
      autocomplete: 0.3,
      autocapitalize: 0.3,
      spellcheck: 0.3,
      contenteditable: 0.3,
      draggable: 0.3,
      dropzone: 0.3,
      tabindex: 0.3,
      accesskey: 0.3,
      cite: 0.3,
      datetime: 0.3,
      coords: 0.3,
      shape: 0.3,
      usemap: 0.3,
      ismap: 0.3,
      download: 0.3,
      ping: 0.3,
      hreflang: 0.3,
      type: 0.3,
      name: 0.3,
      form: 0.3,
      novalidate: 0.2,
      multiple: 0.2,
      selected: 0.2,
      size: 0.2,
      wrap: 0.2,
      hidden: 0.1,
      style: 0.1,
      "data-*": 0.1,
      content: 0.1,
      "http-equiv": 0.1,
      "data-uid": 1,
      "data-aie": 1
    }
  }
};

// src/D2Snap.ts
var TURNDOWN_KEEP_TAG_NAMES = ["a"];
var TURNDOWN_SERVICE = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced"
});
TURNDOWN_SERVICE.addRule("keep", {
  filter: TURNDOWN_KEEP_TAG_NAMES,
  replacement: (_, node) => node.outerHTML
});
TURNDOWN_SERVICE.use(turndownPluginGfm.gfm);
var KEEP_LINE_BREAK_MARK = "@@@";
function isElementType(type, elementNode) {
  return rating_default.typeElement[type].tagNames.includes(elementNode.tagName.toLowerCase());
}
async function takeSnapshot(dom, k = 2, l = 5, m = 0.5, options = {}) {
  const optionsWithDefaults = {
    debug: false,
    assignUniqueIDs: false,
    ...options
  };
  function snapTextNode(textNode, l2) {
    if (textNode.nodeType !== 3 /* TEXT_NODE */) return;
    textNode.textContent = textNode.textContent.trim().split(/\s+/).filter((_, i) => (i + 1) % l2).join(" ");
  }
  function snapAttributeNode(elementNode, m2) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    for (const attr of Array.from(elementNode.attributes)) {
      if (rating_default.typeAttribute.semantics[attr.name] >= m2) continue;
      elementNode.removeAttribute(attr.name);
    }
  }
  function snapElementContentNode(elementNode) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("content", elementNode)) return;
    const markdown = TURNDOWN_SERVICE.turndown(elementNode.outerHTML);
    const markdownNodesFragment = dom.createRange().createContextualFragment(
      markdown.trim().replace(/\n|$/g, KEEP_LINE_BREAK_MARK)
    );
    elementNode.replaceWith(...markdownNodesFragment.childNodes);
  }
  function snapElementInteractiveNode(elementNode) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("interactive", elementNode)) return;
  }
  function snapElementContainerNode(elementNode, k2) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("container", elementNode)) return;
    if (elementNode.depth % k2 === 0) return;
    const getContainerSemantics = (tagName) => rating_default.typeElement.container.semantics[tagName.toLowerCase()];
    const elements = [
      elementNode.parentElement,
      elementNode
    ];
    const mergeUpwards = getContainerSemantics(elements[0].tagName) >= getContainerSemantics(elements[1].tagName);
    !mergeUpwards && elements.reverse();
    const targetEl = elements[0];
    const sourceEl = elements[1];
    const mergedAttributes = Array.from(targetEl.attributes);
    for (const attr of sourceEl.attributes) {
      if (mergedAttributes.some((targetAttr) => targetAttr.name === attr.name)) continue;
      mergedAttributes.push(attr);
    }
    for (const attr of targetEl.attributes) {
      targetEl.removeAttribute(attr.name);
    }
    for (const attr of mergedAttributes) {
      targetEl.setAttribute(attr.name, attr.value);
    }
    if (mergeUpwards) {
      while (sourceEl.childNodes.length) {
        targetEl.insertBefore(sourceEl.childNodes[0], sourceEl);
      }
    } else {
      let afterPivot = false;
      while (sourceEl.childNodes.length > 1) {
        const childNode = sourceEl.childNodes[+afterPivot];
        if (childNode === targetEl) {
          afterPivot = true;
          continue;
        }
        afterPivot || !targetEl.childNodes.length ? targetEl.appendChild(childNode) : targetEl.insertBefore(childNode, targetEl.childNodes[0]);
      }
      targetEl.depth = sourceEl.depth;
      sourceEl.parentNode?.insertBefore(targetEl, sourceEl);
    }
    sourceEl.parentNode?.removeChild(sourceEl);
  }
  function snapElementNode(elementNode) {
    if (isElementType("container", elementNode)) {
      elementNode.depth = (elementNode.parentNode.depth ?? -1) + 1;
      return;
    }
    if (isElementType("content", elementNode)) {
      return snapElementContentNode(elementNode);
    }
    if (isElementType("interactive", elementNode)) {
      snapElementInteractiveNode(elementNode);
      return;
    }
    elementNode.parentNode?.removeChild(elementNode);
  }
  const originalSize = dom.documentElement.outerHTML.length;
  const partialDom = findDownsamplingRoot(dom);
  let n = 0;
  optionsWithDefaults.assignUniqueIDs && await traverseDom(
    dom,
    partialDom,
    1 /* SHOW_ELEMENT */,
    (node) => {
      if (![
        ...rating_default.typeElement.container.tagNames,
        ...rating_default.typeElement.interactive.tagNames
      ].includes(node.tagName.toLowerCase())) return;
      node.setAttribute(config_default.uniqueIDAttribute, (n++).toString());
    }
  );
  const virtualDom = partialDom.cloneNode(true);
  await traverseDom(
    dom,
    virtualDom,
    128 /* SHOW_COMMENT */,
    (node) => node.parentNode?.removeChild(node)
  );
  await traverseDom(
    dom,
    virtualDom,
    1 /* SHOW_ELEMENT */,
    (node) => snapAttributeNode(node, m)
    // work on parent element
  );
  await traverseDom(
    dom,
    virtualDom,
    4 /* SHOW_TEXT */,
    (node) => snapTextNode(node, l)
  );
  await traverseDom(
    dom,
    virtualDom,
    1 /* SHOW_ELEMENT */,
    (node) => snapElementNode(node)
  );
  await traverseDom(
    dom,
    virtualDom,
    1 /* SHOW_ELEMENT */,
    (node) => {
      if (!isElementType("container", node)) return;
      return snapElementContainerNode(node, k);
    }
  );
  const snapshot = virtualDom.innerHTML;
  let serializedHtml = optionsWithDefaults.debug ? formatHtml(snapshot) : snapshot;
  serializedHtml = serializedHtml.replace(new RegExp(KEEP_LINE_BREAK_MARK, "g"), "\n").replace(/\n *(\n|$)/g, "");
  serializedHtml = k === Infinity && virtualDom.children.length ? serializedHtml.trim().replace(/^<[^>]+>\s*/, "").replace(/\s*<\/[^<]+>$/, "") : serializedHtml;
  return {
    serializedHtml,
    meta: {
      originalSize,
      snapshotSize: snapshot.length,
      sizeRatio: snapshot.length / originalSize,
      estimatedTokens: Math.round(snapshot.length / 4)
      // according to https://platform.openai.com/tokenizer
    }
  };
}
async function takeAdaptiveSnapshot(dom, maxTokens = 4096, maxIterations = 5, options = {}) {
  const S = findDownsamplingRoot(dom).outerHTML.length;
  const M = 1e6;
  const computeParameters = (S2) => {
    return {
      k: Math.round(Math.E ** (2 / M * S2)),
      l: Math.round(98 * Math.E ** (-(4 / M) * S2) + 2),
      m: Math.E ** (-(4 / M) * S2)
    };
  };
  let i = 0;
  let parameters, snapshot;
  do {
    i++;
    parameters = computeParameters(S * i ** 0.75);
    snapshot = await takeSnapshot(dom, parameters.k, parameters.l, parameters.m, options);
    i++;
  } while (snapshot.estimatedTokens > maxTokens && i < maxIterations);
  if (i === maxIterations)
    throw new RangeError("Unable to create snapshot below given token threshold");
  return {
    ...snapshot,
    parameters: {
      ...parameters,
      adaptiveIterations: i
    }
  };
}

// src/D2Snap.lib.ts
import { JSDOM } from "jsdom";
function dynamicizeDOM(domOrSerialisedDOM) {
  if (typeof domOrSerialisedDOM !== "string") return domOrSerialisedDOM;
  const dynamicDOM = new JSDOM(domOrSerialisedDOM);
  return dynamicDOM.window.document;
}
function takeSnapshot2(domOrSerialisedDOM, ...args) {
  return takeSnapshot(dynamicizeDOM(domOrSerialisedDOM), ...args);
}
function takeAdaptiveSnapshot2(domOrSerialisedDOM, ...args) {
  return takeAdaptiveSnapshot(dynamicizeDOM(domOrSerialisedDOM), ...args);
}
export {
  takeAdaptiveSnapshot2 as takeAdaptiveSnapshot,
  takeSnapshot2 as takeSnapshot
};
