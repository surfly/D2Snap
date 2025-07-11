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

// src/TextRank.ts
function initArray(n, value = 0) {
  return Array.from({ length: n }, () => value);
}
function initMatrix(n, m = n) {
  return initArray(n).map(() => initArray(m));
}
function tokenizeSentences(text) {
  return text.replace(/[^\w\s.?!:]+/g, "").split(/[.?!:]\s|\n|\r/g).map((rawSentence) => rawSentence.trim()).filter((sentence) => !!sentence);
}
function textRank(textOrSentences, k = 3, options = {}) {
  const optionsWithDefaults = {
    damping: 0.75,
    maxIterations: 20,
    ...options
  };
  const sentences = !Array.isArray(textOrSentences) ? tokenizeSentences(textOrSentences) : textOrSentences;
  const sentenceTokens = sentences.map((sentence) => sentence.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((token) => !!token.trim()));
  const n = sentences.length;
  const similarityMatrix = initMatrix(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const vector1 = [];
      const vector2 = [];
      for (const token of new Set(sentenceTokens[i].concat(sentenceTokens[j]))) {
        vector1.push(sentenceTokens[i].filter((w) => w === token).length);
        vector2.push(sentenceTokens[j].filter((w) => w === token).length);
      }
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i2 = 0; i2 < vector1.length; i2++) {
        dotProduct += vector1[i2] * vector2[i2];
        normA += vector1[i2] * vector1[i2];
        normB += vector2[i2] * vector2[i2];
      }
      similarityMatrix[i][j] = dotProduct / (normA ** 0.5 * normB ** 0.5 + 1e-10);
    }
  }
  const scores = initArray(n, 1);
  for (let iteration = 0; iteration < optionsWithDefaults.maxIterations; iteration++) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        let norm = 0;
        for (let i2 = 0; i2 < similarityMatrix[j].length; i2++) {
          norm += similarityMatrix[j][i2] * similarityMatrix[i2][i2];
        }
        sum += similarityMatrix[j][i] / (norm || 1) * scores[j];
      }
      scores[i] = optionsWithDefaults.damping * sum + (1 - optionsWithDefaults.damping);
    }
  }
  return sentences.map((sentence, i) => {
    return {
      sentence,
      index: i,
      score: scores[i]
    };
  }).sort((a, b) => b.score - a.score).slice(0, Math.min(k, sentences.length)).sort((a, b) => a.index - b.index).map((obj) => obj.sentence).join(" ");
}
function relativeTextRank(text, ratio = 0.5, options = {}, noEmpty = false) {
  const sentences = tokenizeSentences(text);
  const k = Math.max(
    Math.round(sentences.length * ratio),
    1
  );
  console.log(k, ratio, +noEmpty, Math.max(k, +noEmpty));
  return textRank(sentences, Math.max(k, +noEmpty), options);
}

// src/Turndown.ts
import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm";
var KEEP_TAG_NAMES = ["a"];
var SERVICE = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced"
});
SERVICE.addRule("keep", {
  filter: KEEP_TAG_NAMES,
  replacement: (_, node) => node.outerHTML
});
SERVICE.use(turndownPluginGfm.gfm);
var KEEP_LINE_BREAK_MARK = "@@@";
function turndown(markup) {
  return SERVICE.turndown(markup).trim().replace(/\n|$/g, KEEP_LINE_BREAK_MARK);
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
var FILTER_TAG_NAMES = [
  "SCRIPT",
  "STYLE",
  "LINK"
];
function validateParam(param, allowInfinity = false) {
  if (allowInfinity && param === Infinity) return;
  if (param < 0 || param > 1)
    throw new RangeError(`Invalid parameter ${param}, expects value in [0, 1]`);
}
function isElementType(type, elementNode) {
  return rating_default.typeElement[type].tagNames.includes(elementNode.tagName.toLowerCase());
}
async function d2Snap(dom, k = 0.4, l = 0.5, m = 0.6, options = {}) {
  validateParam(k, true);
  validateParam(l);
  validateParam(m);
  const optionsWithDefaults = {
    debug: false,
    assignUniqueIDs: false,
    ...options
  };
  function snapElementNode(elementNode) {
    if (isElementType("container", elementNode)) return;
    if (isElementType("content", elementNode)) {
      return snapElementContentNode(elementNode);
    }
    if (isElementType("interactive", elementNode)) {
      snapElementInteractiveNode(elementNode);
      return;
    }
    elementNode.parentNode?.removeChild(elementNode);
  }
  function snapElementContainerNode(elementNode, k2, domTreeHeight2) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("container", elementNode)) return;
    const mergeLevels = Math.max(
      Math.round(domTreeHeight2 * Math.min(1, k2)),
      1
    );
    if ((elementNode.depth - 1) % mergeLevels === 0) return;
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
  function snapElementContentNode(elementNode) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("content", elementNode)) return;
    const markdown = turndown(elementNode.outerHTML);
    const markdownNodesFragment = dom.createRange().createContextualFragment(markdown);
    elementNode.replaceWith(...markdownNodesFragment.childNodes);
  }
  function snapElementInteractiveNode(elementNode) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    if (!isElementType("interactive", elementNode)) return;
  }
  function snapTextNode(textNode, l2) {
    if (textNode.nodeType !== 3 /* TEXT_NODE */) return;
    const text = textNode?.innerText ?? textNode.textContent;
    textNode.textContent = relativeTextRank(text, 1 - l2, void 0, true);
  }
  function snapAttributeNode(elementNode, m2) {
    if (elementNode.nodeType !== 1 /* ELEMENT_NODE */) return;
    for (const attr of Array.from(elementNode.attributes)) {
      if (rating_default.typeAttribute.semantics[attr.name] >= m2) continue;
      elementNode.removeAttribute(attr.name);
    }
  }
  const originalSize = dom.documentElement.outerHTML.length;
  const partialDom = findDownsamplingRoot(dom);
  let n = 0;
  optionsWithDefaults.assignUniqueIDs && await traverseDom(
    dom,
    partialDom,
    1 /* SHOW_ELEMENT */,
    (elementNode) => {
      if (![
        ...rating_default.typeElement.container.tagNames,
        ...rating_default.typeElement.interactive.tagNames
      ].includes(elementNode.tagName.toLowerCase())) return;
      elementNode.setAttribute(config_default.uniqueIDAttribute, (n++).toString());
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
    (elementNode) => {
      if (!FILTER_TAG_NAMES.includes(elementNode.tagName.toUpperCase())) return;
      elementNode.parentNode?.removeChild(elementNode);
    }
  );
  let domTreeHeight = 0;
  await traverseDom(
    dom,
    virtualDom,
    1 /* SHOW_ELEMENT */,
    (elementNode) => {
      const depth = (elementNode.parentNode.depth ?? 0) + 1;
      elementNode.depth = depth;
      domTreeHeight = Math.max(depth, domTreeHeight);
    }
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
      return snapElementContainerNode(node, k, domTreeHeight);
    }
  );
  await traverseDom(
    dom,
    virtualDom,
    1 /* SHOW_ELEMENT */,
    (node) => snapAttributeNode(node, m)
    // work on parent element
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
async function adaptiveD2Snap(dom, maxTokens = 4096, maxIterations = 5, options = {}) {
  const S = findDownsamplingRoot(dom).outerHTML.length;
  const M = 1e6;
  function* generateHalton() {
    const halton = (index, base) => {
      let result = 0;
      let f = 1 / base;
      let i3 = index;
      while (i3 > 0) {
        result += f * (i3 % base);
        i3 = Math.floor(i3 / base);
        f /= base;
      }
      return result;
    };
    let i2 = 0;
    while (true) {
      i2++;
      yield [
        halton(i2, 2),
        halton(i2, 3),
        halton(i2, 5)
      ];
    }
  }
  let i = 0;
  let sCalc = S;
  let parameters, snapshot;
  const haltonGenerator = generateHalton();
  while (true) {
    const haltonPoint = haltonGenerator.next().value;
    const computeParam = (haltonValue) => Math.min(sCalc / M * haltonValue, 1);
    parameters = {
      k: computeParam(haltonPoint[0]),
      l: computeParam(haltonPoint[1]),
      m: computeParam(haltonPoint[2])
    };
    snapshot = await d2Snap(dom, parameters.k, parameters.l, parameters.m, options);
    sCalc = sCalc ** 1.125;
    if (snapshot.meta.estimatedTokens <= maxTokens)
      break;
    if (i++ === maxIterations)
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

// src/D2Snap.lib.ts
import { JSDOM } from "jsdom";
function dynamicizeDOM(domOrSerialisedDOM) {
  if (typeof domOrSerialisedDOM !== "string") return domOrSerialisedDOM;
  const dynamicDOM = new JSDOM(domOrSerialisedDOM);
  return dynamicDOM.window.document;
}
function d2Snap2(domOrSerialisedDOM, ...args) {
  return d2Snap(dynamicizeDOM(domOrSerialisedDOM), ...args);
}
function adaptiveD2Snap2(domOrSerialisedDOM, ...args) {
  return adaptiveD2Snap(dynamicizeDOM(domOrSerialisedDOM), ...args);
}
export {
  adaptiveD2Snap2 as adaptiveD2Snap,
  d2Snap2 as d2Snap
};
