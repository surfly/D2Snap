export enum NodeFilter {
    SHOW_ALL = 4294967295,
    SHOW_ATTRIBUTE = 2,
    SHOW_COMMENT = 128,
    SHOW_ELEMENT = 1,
    SHOW_TEXT = 4
};

export enum Node {
    ELEMENT_NODE = 1,
    ATTRIBUTE_NODE = 2,
    TEXT_NODE = 3
}

export type TDepth = { depth: number; };
export type TTextNode = Node & {
    nodeType: number;
    textContent: string;
};
export type TDepthElement = HTMLElement & TDepth;

export type TDOM = Document;

export type TOptions = {
    debug?: boolean;
    assignUniqueIDs?: boolean;
};

export type TSnapshot = {
    serializedHtml: string;
    meta: {
        originalSize: number;
        snapshotSize: number;
        sizeRatio: number;
        estimatedTokens: number;
    }
};