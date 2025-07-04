// --------------------------
// Copyright (c) Dom Christie
// --------------------------

import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm"


const KEEP_TAG_NAMES = [ "a" ];

const SERVICE = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
});
SERVICE.addRule("keep", {
    filter: KEEP_TAG_NAMES,
    replacement: (_, node) => node.outerHTML
});
SERVICE.use(turndownPluginGfm.gfm)


export const KEEP_LINE_BREAK_MARK = "@@@";


export function turndown(markup: string): string {
    return SERVICE
        .turndown(markup)
        .trim()
        .replace(/\n|$/g, KEEP_LINE_BREAK_MARK);
}