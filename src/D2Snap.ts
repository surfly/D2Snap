// Copyright (c) Dom Christie
import TurndownService from "turndown";
import * as turndownPluginGfm from "turndown-plugin-gfm"
// --------------------------

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