(() => {
  // node_modules/turndown/lib/turndown.browser.es.js
  function extend(destination) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (source.hasOwnProperty(key)) destination[key] = source[key];
      }
    }
    return destination;
  }
  function repeat(character, count) {
    return Array(count + 1).join(character);
  }
  function trimLeadingNewlines(string) {
    return string.replace(/^\n*/, "");
  }
  function trimTrailingNewlines(string) {
    var indexEnd = string.length;
    while (indexEnd > 0 && string[indexEnd - 1] === "\n") indexEnd--;
    return string.substring(0, indexEnd);
  }
  var blockElements = [
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "AUDIO",
    "BLOCKQUOTE",
    "BODY",
    "CANVAS",
    "CENTER",
    "DD",
    "DIR",
    "DIV",
    "DL",
    "DT",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "FRAMESET",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HGROUP",
    "HR",
    "HTML",
    "ISINDEX",
    "LI",
    "MAIN",
    "MENU",
    "NAV",
    "NOFRAMES",
    "NOSCRIPT",
    "OL",
    "OUTPUT",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ];
  function isBlock(node) {
    return is(node, blockElements);
  }
  var voidElements = [
    "AREA",
    "BASE",
    "BR",
    "COL",
    "COMMAND",
    "EMBED",
    "HR",
    "IMG",
    "INPUT",
    "KEYGEN",
    "LINK",
    "META",
    "PARAM",
    "SOURCE",
    "TRACK",
    "WBR"
  ];
  function isVoid(node) {
    return is(node, voidElements);
  }
  function hasVoid(node) {
    return has(node, voidElements);
  }
  var meaningfulWhenBlankElements = [
    "A",
    "TABLE",
    "THEAD",
    "TBODY",
    "TFOOT",
    "TH",
    "TD",
    "IFRAME",
    "SCRIPT",
    "AUDIO",
    "VIDEO"
  ];
  function isMeaningfulWhenBlank(node) {
    return is(node, meaningfulWhenBlankElements);
  }
  function hasMeaningfulWhenBlank(node) {
    return has(node, meaningfulWhenBlankElements);
  }
  function is(node, tagNames) {
    return tagNames.indexOf(node.nodeName) >= 0;
  }
  function has(node, tagNames) {
    return node.getElementsByTagName && tagNames.some(function(tagName) {
      return node.getElementsByTagName(tagName).length;
    });
  }
  var rules = {};
  rules.paragraph = {
    filter: "p",
    replacement: function(content) {
      return "\n\n" + content + "\n\n";
    }
  };
  rules.lineBreak = {
    filter: "br",
    replacement: function(content, node, options) {
      return options.br + "\n";
    }
  };
  rules.heading = {
    filter: ["h1", "h2", "h3", "h4", "h5", "h6"],
    replacement: function(content, node, options) {
      var hLevel = Number(node.nodeName.charAt(1));
      if (options.headingStyle === "setext" && hLevel < 3) {
        var underline = repeat(hLevel === 1 ? "=" : "-", content.length);
        return "\n\n" + content + "\n" + underline + "\n\n";
      } else {
        return "\n\n" + repeat("#", hLevel) + " " + content + "\n\n";
      }
    }
  };
  rules.blockquote = {
    filter: "blockquote",
    replacement: function(content) {
      content = content.replace(/^\n+|\n+$/g, "");
      content = content.replace(/^/gm, "> ");
      return "\n\n" + content + "\n\n";
    }
  };
  rules.list = {
    filter: ["ul", "ol"],
    replacement: function(content, node) {
      var parent = node.parentNode;
      if (parent.nodeName === "LI" && parent.lastElementChild === node) {
        return "\n" + content;
      } else {
        return "\n\n" + content + "\n\n";
      }
    }
  };
  rules.listItem = {
    filter: "li",
    replacement: function(content, node, options) {
      content = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n    ");
      var prefix = options.bulletListMarker + "   ";
      var parent = node.parentNode;
      if (parent.nodeName === "OL") {
        var start = parent.getAttribute("start");
        var index = Array.prototype.indexOf.call(parent.children, node);
        prefix = (start ? Number(start) + index : index + 1) + ".  ";
      }
      return prefix + content + (node.nextSibling && !/\n$/.test(content) ? "\n" : "");
    }
  };
  rules.indentedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "indented" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      return "\n\n    " + node.firstChild.textContent.replace(/\n/g, "\n    ") + "\n\n";
    }
  };
  rules.fencedCodeBlock = {
    filter: function(node, options) {
      return options.codeBlockStyle === "fenced" && node.nodeName === "PRE" && node.firstChild && node.firstChild.nodeName === "CODE";
    },
    replacement: function(content, node, options) {
      var className = node.firstChild.getAttribute("class") || "";
      var language = (className.match(/language-(\S+)/) || [null, ""])[1];
      var code = node.firstChild.textContent;
      var fenceChar = options.fence.charAt(0);
      var fenceSize = 3;
      var fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");
      var match;
      while (match = fenceInCodeRegex.exec(code)) {
        if (match[0].length >= fenceSize) {
          fenceSize = match[0].length + 1;
        }
      }
      var fence = repeat(fenceChar, fenceSize);
      return "\n\n" + fence + language + "\n" + code.replace(/\n$/, "") + "\n" + fence + "\n\n";
    }
  };
  rules.horizontalRule = {
    filter: "hr",
    replacement: function(content, node, options) {
      return "\n\n" + options.hr + "\n\n";
    }
  };
  rules.inlineLink = {
    filter: function(node, options) {
      return options.linkStyle === "inlined" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node) {
      var href = node.getAttribute("href");
      if (href) href = href.replace(/([()])/g, "\\$1");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
      return "[" + content + "](" + href + title + ")";
    }
  };
  rules.referenceLink = {
    filter: function(node, options) {
      return options.linkStyle === "referenced" && node.nodeName === "A" && node.getAttribute("href");
    },
    replacement: function(content, node, options) {
      var href = node.getAttribute("href");
      var title = cleanAttribute(node.getAttribute("title"));
      if (title) title = ' "' + title + '"';
      var replacement;
      var reference;
      switch (options.linkReferenceStyle) {
        case "collapsed":
          replacement = "[" + content + "][]";
          reference = "[" + content + "]: " + href + title;
          break;
        case "shortcut":
          replacement = "[" + content + "]";
          reference = "[" + content + "]: " + href + title;
          break;
        default:
          var id = this.references.length + 1;
          replacement = "[" + content + "][" + id + "]";
          reference = "[" + id + "]: " + href + title;
      }
      this.references.push(reference);
      return replacement;
    },
    references: [],
    append: function(options) {
      var references = "";
      if (this.references.length) {
        references = "\n\n" + this.references.join("\n") + "\n\n";
        this.references = [];
      }
      return references;
    }
  };
  rules.emphasis = {
    filter: ["em", "i"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.emDelimiter + content + options.emDelimiter;
    }
  };
  rules.strong = {
    filter: ["strong", "b"],
    replacement: function(content, node, options) {
      if (!content.trim()) return "";
      return options.strongDelimiter + content + options.strongDelimiter;
    }
  };
  rules.code = {
    filter: function(node) {
      var hasSiblings = node.previousSibling || node.nextSibling;
      var isCodeBlock = node.parentNode.nodeName === "PRE" && !hasSiblings;
      return node.nodeName === "CODE" && !isCodeBlock;
    },
    replacement: function(content) {
      if (!content) return "";
      content = content.replace(/\r?\n|\r/g, " ");
      var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? " " : "";
      var delimiter = "`";
      var matches = content.match(/`+/gm) || [];
      while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + "`";
      return delimiter + extraSpace + content + extraSpace + delimiter;
    }
  };
  rules.image = {
    filter: "img",
    replacement: function(content, node) {
      var alt = cleanAttribute(node.getAttribute("alt"));
      var src = node.getAttribute("src") || "";
      var title = cleanAttribute(node.getAttribute("title"));
      var titlePart = title ? ' "' + title + '"' : "";
      return src ? "![" + alt + "](" + src + titlePart + ")" : "";
    }
  };
  function cleanAttribute(attribute) {
    return attribute ? attribute.replace(/(\n+\s*)+/g, "\n") : "";
  }
  function Rules(options) {
    this.options = options;
    this._keep = [];
    this._remove = [];
    this.blankRule = {
      replacement: options.blankReplacement
    };
    this.keepReplacement = options.keepReplacement;
    this.defaultRule = {
      replacement: options.defaultReplacement
    };
    this.array = [];
    for (var key in options.rules) this.array.push(options.rules[key]);
  }
  Rules.prototype = {
    add: function(key, rule) {
      this.array.unshift(rule);
    },
    keep: function(filter) {
      this._keep.unshift({
        filter,
        replacement: this.keepReplacement
      });
    },
    remove: function(filter) {
      this._remove.unshift({
        filter,
        replacement: function() {
          return "";
        }
      });
    },
    forNode: function(node) {
      if (node.isBlank) return this.blankRule;
      var rule;
      if (rule = findRule(this.array, node, this.options)) return rule;
      if (rule = findRule(this._keep, node, this.options)) return rule;
      if (rule = findRule(this._remove, node, this.options)) return rule;
      return this.defaultRule;
    },
    forEach: function(fn) {
      for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
    }
  };
  function findRule(rules3, node, options) {
    for (var i = 0; i < rules3.length; i++) {
      var rule = rules3[i];
      if (filterValue(rule, node, options)) return rule;
    }
    return void 0;
  }
  function filterValue(rule, node, options) {
    var filter = rule.filter;
    if (typeof filter === "string") {
      if (filter === node.nodeName.toLowerCase()) return true;
    } else if (Array.isArray(filter)) {
      if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true;
    } else if (typeof filter === "function") {
      if (filter.call(rule, node, options)) return true;
    } else {
      throw new TypeError("`filter` needs to be a string, array, or function");
    }
  }
  function collapseWhitespace(options) {
    var element = options.element;
    var isBlock2 = options.isBlock;
    var isVoid2 = options.isVoid;
    var isPre = options.isPre || function(node2) {
      return node2.nodeName === "PRE";
    };
    if (!element.firstChild || isPre(element)) return;
    var prevText = null;
    var keepLeadingWs = false;
    var prev = null;
    var node = next(prev, element, isPre);
    while (node !== element) {
      if (node.nodeType === 3 || node.nodeType === 4) {
        var text = node.data.replace(/[ \r\n\t]+/g, " ");
        if ((!prevText || / $/.test(prevText.data)) && !keepLeadingWs && text[0] === " ") {
          text = text.substr(1);
        }
        if (!text) {
          node = remove(node);
          continue;
        }
        node.data = text;
        prevText = node;
      } else if (node.nodeType === 1) {
        if (isBlock2(node) || node.nodeName === "BR") {
          if (prevText) {
            prevText.data = prevText.data.replace(/ $/, "");
          }
          prevText = null;
          keepLeadingWs = false;
        } else if (isVoid2(node) || isPre(node)) {
          prevText = null;
          keepLeadingWs = true;
        } else if (prevText) {
          keepLeadingWs = false;
        }
      } else {
        node = remove(node);
        continue;
      }
      var nextNode = next(prev, node, isPre);
      prev = node;
      node = nextNode;
    }
    if (prevText) {
      prevText.data = prevText.data.replace(/ $/, "");
      if (!prevText.data) {
        remove(prevText);
      }
    }
  }
  function remove(node) {
    var next2 = node.nextSibling || node.parentNode;
    node.parentNode.removeChild(node);
    return next2;
  }
  function next(prev, current, isPre) {
    if (prev && prev.parentNode === current || isPre(current)) {
      return current.nextSibling || current.parentNode;
    }
    return current.firstChild || current.nextSibling || current.parentNode;
  }
  var root = typeof window !== "undefined" ? window : {};
  function canParseHTMLNatively() {
    var Parser = root.DOMParser;
    var canParse = false;
    try {
      if (new Parser().parseFromString("", "text/html")) {
        canParse = true;
      }
    } catch (e) {
    }
    return canParse;
  }
  function createHTMLParser() {
    var Parser = function() {
    };
    {
      if (shouldUseActiveX()) {
        Parser.prototype.parseFromString = function(string) {
          var doc = new window.ActiveXObject("htmlfile");
          doc.designMode = "on";
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      } else {
        Parser.prototype.parseFromString = function(string) {
          var doc = document.implementation.createHTMLDocument("");
          doc.open();
          doc.write(string);
          doc.close();
          return doc;
        };
      }
    }
    return Parser;
  }
  function shouldUseActiveX() {
    var useActiveX = false;
    try {
      document.implementation.createHTMLDocument("").open();
    } catch (e) {
      if (root.ActiveXObject) useActiveX = true;
    }
    return useActiveX;
  }
  var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();
  function RootNode(input, options) {
    var root2;
    if (typeof input === "string") {
      var doc = htmlParser().parseFromString(
        // DOM parsers arrange elements in the <head> and <body>.
        // Wrapping in a custom element ensures elements are reliably arranged in
        // a single element.
        '<x-turndown id="turndown-root">' + input + "</x-turndown>",
        "text/html"
      );
      root2 = doc.getElementById("turndown-root");
    } else {
      root2 = input.cloneNode(true);
    }
    collapseWhitespace({
      element: root2,
      isBlock,
      isVoid,
      isPre: options.preformattedCode ? isPreOrCode : null
    });
    return root2;
  }
  var _htmlParser;
  function htmlParser() {
    _htmlParser = _htmlParser || new HTMLParser();
    return _htmlParser;
  }
  function isPreOrCode(node) {
    return node.nodeName === "PRE" || node.nodeName === "CODE";
  }
  function Node(node, options) {
    node.isBlock = isBlock(node);
    node.isCode = node.nodeName === "CODE" || node.parentNode.isCode;
    node.isBlank = isBlank(node);
    node.flankingWhitespace = flankingWhitespace(node, options);
    return node;
  }
  function isBlank(node) {
    return !isVoid(node) && !isMeaningfulWhenBlank(node) && /^\s*$/i.test(node.textContent) && !hasVoid(node) && !hasMeaningfulWhenBlank(node);
  }
  function flankingWhitespace(node, options) {
    if (node.isBlock || options.preformattedCode && node.isCode) {
      return { leading: "", trailing: "" };
    }
    var edges = edgeWhitespace(node.textContent);
    if (edges.leadingAscii && isFlankedByWhitespace("left", node, options)) {
      edges.leading = edges.leadingNonAscii;
    }
    if (edges.trailingAscii && isFlankedByWhitespace("right", node, options)) {
      edges.trailing = edges.trailingNonAscii;
    }
    return { leading: edges.leading, trailing: edges.trailing };
  }
  function edgeWhitespace(string) {
    var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
    return {
      leading: m[1],
      // whole string for whitespace-only strings
      leadingAscii: m[2],
      leadingNonAscii: m[3],
      trailing: m[4],
      // empty for whitespace-only strings
      trailingNonAscii: m[5],
      trailingAscii: m[6]
    };
  }
  function isFlankedByWhitespace(side, node, options) {
    var sibling;
    var regExp;
    var isFlanked;
    if (side === "left") {
      sibling = node.previousSibling;
      regExp = / $/;
    } else {
      sibling = node.nextSibling;
      regExp = /^ /;
    }
    if (sibling) {
      if (sibling.nodeType === 3) {
        isFlanked = regExp.test(sibling.nodeValue);
      } else if (options.preformattedCode && sibling.nodeName === "CODE") {
        isFlanked = false;
      } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
        isFlanked = regExp.test(sibling.textContent);
      }
    }
    return isFlanked;
  }
  var reduce = Array.prototype.reduce;
  var escapes = [
    [/\\/g, "\\\\"],
    [/\*/g, "\\*"],
    [/^-/g, "\\-"],
    [/^\+ /g, "\\+ "],
    [/^(=+)/g, "\\$1"],
    [/^(#{1,6}) /g, "\\$1 "],
    [/`/g, "\\`"],
    [/^~~~/g, "\\~~~"],
    [/\[/g, "\\["],
    [/\]/g, "\\]"],
    [/^>/g, "\\>"],
    [/_/g, "\\_"],
    [/^(\d+)\. /g, "$1\\. "]
  ];
  function TurndownService(options) {
    if (!(this instanceof TurndownService)) return new TurndownService(options);
    var defaults = {
      rules,
      headingStyle: "setext",
      hr: "* * *",
      bulletListMarker: "*",
      codeBlockStyle: "indented",
      fence: "```",
      emDelimiter: "_",
      strongDelimiter: "**",
      linkStyle: "inlined",
      linkReferenceStyle: "full",
      br: "  ",
      preformattedCode: false,
      blankReplacement: function(content, node) {
        return node.isBlock ? "\n\n" : "";
      },
      keepReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + node.outerHTML + "\n\n" : node.outerHTML;
      },
      defaultReplacement: function(content, node) {
        return node.isBlock ? "\n\n" + content + "\n\n" : content;
      }
    };
    this.options = extend({}, defaults, options);
    this.rules = new Rules(this.options);
  }
  TurndownService.prototype = {
    /**
     * The entry point for converting a string or DOM node to Markdown
     * @public
     * @param {String|HTMLElement} input The string or DOM node to convert
     * @returns A Markdown representation of the input
     * @type String
     */
    turndown: function(input) {
      if (!canConvert(input)) {
        throw new TypeError(
          input + " is not a string, or an element/document/fragment node."
        );
      }
      if (input === "") return "";
      var output = process.call(this, new RootNode(input, this.options));
      return postProcess.call(this, output);
    },
    /**
     * Add one or more plugins
     * @public
     * @param {Function|Array} plugin The plugin or array of plugins to add
     * @returns The Turndown instance for chaining
     * @type Object
     */
    use: function(plugin) {
      if (Array.isArray(plugin)) {
        for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
      } else if (typeof plugin === "function") {
        plugin(this);
      } else {
        throw new TypeError("plugin must be a Function or an Array of Functions");
      }
      return this;
    },
    /**
     * Adds a rule
     * @public
     * @param {String} key The unique key of the rule
     * @param {Object} rule The rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    addRule: function(key, rule) {
      this.rules.add(key, rule);
      return this;
    },
    /**
     * Keep a node (as HTML) that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    keep: function(filter) {
      this.rules.keep(filter);
      return this;
    },
    /**
     * Remove a node that matches the filter
     * @public
     * @param {String|Array|Function} filter The unique key of the rule
     * @returns The Turndown instance for chaining
     * @type Object
     */
    remove: function(filter) {
      this.rules.remove(filter);
      return this;
    },
    /**
     * Escapes Markdown syntax
     * @public
     * @param {String} string The string to escape
     * @returns A string with Markdown syntax escaped
     * @type String
     */
    escape: function(string) {
      return escapes.reduce(function(accumulator, escape) {
        return accumulator.replace(escape[0], escape[1]);
      }, string);
    }
  };
  function process(parentNode) {
    var self = this;
    return reduce.call(parentNode.childNodes, function(output, node) {
      node = new Node(node, self.options);
      var replacement = "";
      if (node.nodeType === 3) {
        replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
      } else if (node.nodeType === 1) {
        replacement = replacementForNode.call(self, node);
      }
      return join(output, replacement);
    }, "");
  }
  function postProcess(output) {
    var self = this;
    this.rules.forEach(function(rule) {
      if (typeof rule.append === "function") {
        output = join(output, rule.append(self.options));
      }
    });
    return output.replace(/^[\t\r\n]+/, "").replace(/[\t\r\n\s]+$/, "");
  }
  function replacementForNode(node) {
    var rule = this.rules.forNode(node);
    var content = process.call(this, node);
    var whitespace = node.flankingWhitespace;
    if (whitespace.leading || whitespace.trailing) content = content.trim();
    return whitespace.leading + rule.replacement(content, node, this.options) + whitespace.trailing;
  }
  function join(output, replacement) {
    var s1 = trimTrailingNewlines(output);
    var s2 = trimLeadingNewlines(replacement);
    var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
    var separator = "\n\n".substring(0, nls);
    return s1 + separator + s2;
  }
  function canConvert(input) {
    return input != null && (typeof input === "string" || input.nodeType && (input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11));
  }
  var turndown_browser_es_default = TurndownService;

  // node_modules/turndown-plugin-gfm/lib/turndown-plugin-gfm.es.js
  var highlightRegExp = /highlight-(?:text|source)-([a-z0-9]+)/;
  function highlightedCodeBlock(turndownService) {
    turndownService.addRule("highlightedCodeBlock", {
      filter: function(node) {
        var firstChild = node.firstChild;
        return node.nodeName === "DIV" && highlightRegExp.test(node.className) && firstChild && firstChild.nodeName === "PRE";
      },
      replacement: function(content, node, options) {
        var className = node.className || "";
        var language = (className.match(highlightRegExp) || [null, ""])[1];
        return "\n\n" + options.fence + language + "\n" + node.firstChild.textContent + "\n" + options.fence + "\n\n";
      }
    });
  }
  function strikethrough(turndownService) {
    turndownService.addRule("strikethrough", {
      filter: ["del", "s", "strike"],
      replacement: function(content) {
        return "~" + content + "~";
      }
    });
  }
  var indexOf = Array.prototype.indexOf;
  var every = Array.prototype.every;
  var rules2 = {};
  rules2.tableCell = {
    filter: ["th", "td"],
    replacement: function(content, node) {
      return cell(content, node);
    }
  };
  rules2.tableRow = {
    filter: "tr",
    replacement: function(content, node) {
      var borderCells = "";
      var alignMap = { left: ":--", right: "--:", center: ":-:" };
      if (isHeadingRow(node)) {
        for (var i = 0; i < node.childNodes.length; i++) {
          var border = "---";
          var align = (node.childNodes[i].getAttribute("align") || "").toLowerCase();
          if (align) border = alignMap[align] || border;
          borderCells += cell(border, node.childNodes[i]);
        }
      }
      return "\n" + content + (borderCells ? "\n" + borderCells : "");
    }
  };
  rules2.table = {
    // Only convert tables with a heading row.
    // Tables with no heading row are kept using `keep` (see below).
    filter: function(node) {
      return node.nodeName === "TABLE" && isHeadingRow(node.rows[0]);
    },
    replacement: function(content) {
      content = content.replace("\n\n", "\n");
      return "\n\n" + content + "\n\n";
    }
  };
  rules2.tableSection = {
    filter: ["thead", "tbody", "tfoot"],
    replacement: function(content) {
      return content;
    }
  };
  function isHeadingRow(tr) {
    var parentNode = tr.parentNode;
    return parentNode.nodeName === "THEAD" || parentNode.firstChild === tr && (parentNode.nodeName === "TABLE" || isFirstTbody(parentNode)) && every.call(tr.childNodes, function(n) {
      return n.nodeName === "TH";
    });
  }
  function isFirstTbody(element) {
    var previousSibling = element.previousSibling;
    return element.nodeName === "TBODY" && (!previousSibling || previousSibling.nodeName === "THEAD" && /^\s*$/i.test(previousSibling.textContent));
  }
  function cell(content, node) {
    var index = indexOf.call(node.parentNode.childNodes, node);
    var prefix = " ";
    if (index === 0) prefix = "| ";
    return prefix + content + " |";
  }
  function tables(turndownService) {
    turndownService.keep(function(node) {
      return node.nodeName === "TABLE" && !isHeadingRow(node.rows[0]);
    });
    for (var key in rules2) turndownService.addRule(key, rules2[key]);
  }
  function taskListItems(turndownService) {
    turndownService.addRule("taskListItems", {
      filter: function(node) {
        return node.type === "checkbox" && node.parentNode.nodeName === "LI";
      },
      replacement: function(content, node) {
        return (node.checked ? "[x]" : "[ ]") + " ";
      }
    });
  }
  function gfm(turndownService) {
    turndownService.use([
      highlightedCodeBlock,
      strikethrough,
      tables,
      taskListItems
    ]);
  }

  // src/util.ts
  function findDownsamplingRoot(dom) {
    return dom.body ?? dom.documentElement;
  }
  async function traverseDom(dom, root2, filter = NodeFilter.SHOW_ALL, cb) {
    const walker = dom.createTreeWalker(root2, filter);
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
  var TURNDOWN_SERVICE = new turndown_browser_es_default({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced"
  });
  TURNDOWN_SERVICE.addRule("keep", {
    filter: TURNDOWN_KEEP_TAG_NAMES,
    replacement: (_, node) => node.outerHTML
  });
  TURNDOWN_SERVICE.use(gfm);
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
    const virtualDomRoot = k === Infinity && virtualDom.children.length ? virtualDom.children[0] : virtualDom;
    const snapshot = virtualDomRoot.innerHTML;
    let serializedHtml = optionsWithDefaults.debug ? formatHtml(snapshot) : snapshot;
    serializedHtml = serializedHtml.replace(new RegExp(KEEP_LINE_BREAK_MARK, "g"), "\n").replace(/\n *(\n|$)/g, "");
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

  // src/D2Snap.browser.ts
  window.D2Snap = {};
  window.D2Snap.takeSnapshot = function(...args) {
    return takeSnapshot(document, ...args);
  };
  window.D2Snap.takeAdaptiveSnapshot = function(...args) {
    return takeAdaptiveSnapshot(document, ...args);
  };
})();
