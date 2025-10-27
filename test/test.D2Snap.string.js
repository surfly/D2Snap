import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

import { d2Snap, adaptiveD2Snap } from "../dist/api.js";


function path(fileName) {
    return join(import.meta.dirname, `${fileName}.html`);
}

function readFile(fileName) {
    return readFileSync(path(fileName)).toString();
}

function readExpected(domName) {
    try {
        return readFile(`${domName}.string.expected`);
    } catch {
        return readFile(`${domName}.expected`);
    }
}

function writeActual(domName, html) {
    return writeFileSync(path(`${domName}.string.actual`), html);
}

function flattenDOMSnapshot(snapshot) {
    return snapshot
        .trim()
        .replace(/\s*(\n|\r)+\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+(?=<)|(?=>)\s+/g, "");
}


await test("Take adaptive DOM snapshot (4096) [string]", async () => {
    const snapshot = await adaptiveD2Snap(readFile("agents"), 4096, 5, {
        debug: true,
        assignUniqueIDs: true
    });

    writeActual("agents.4096", snapshot.serializedHtml);

    assertLess(
        snapshot.serializedHtml.length / 4,
        4096,
        "Invalid adaptive DOM snapshot size"
    );
});

await test("Take adaptive DOM snapshot (2048) [string]", async() => {
    const snapshot = await adaptiveD2Snap(readFile("agents"), 2048, 5, {
        debug: true,
        assignUniqueIDs: true
    });

    writeActual("agents.2048", snapshot.serializedHtml);

    assertLess(
        snapshot.serializedHtml.length / 4,
        2048,
        "Invalid adaptive DOM snapshot size"
    );
});

await test("Take DOM snapshot (L) [string]", async () => {
    const snapshot = await d2Snap(readFile("pizza"), 0.3, 0.3, 0.3, {
        debug: true
    });

    writeActual("pizza.l", snapshot.serializedHtml);
    const expected = readExpected("pizza.l");

    assertAlmostEqual(
        snapshot.meta.originalSize,
        670,
        -1,
        "Invalid DOM snapshot original size"
    );

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.44,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});

await test("Take DOM snapshot (M) [string]", async() => {
    const snapshot = await d2Snap(readFile("pizza"), 0.4, 0.6, 0.8, {
        debug: true
    });

    writeActual("pizza.m", snapshot.serializedHtml);
    const expected = readExpected("pizza.m");

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.21,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});

await test("Take DOM snapshot (S) [string]", async () => {
    const snapshot = await d2Snap(readFile("pizza"), 1.0, 1.0, 1.0, {
        debug: true
    });

    writeActual("pizza.s", snapshot.serializedHtml);
    const expected = readExpected("pizza.s");

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.19,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});

await test("Take DOM snapshot (linearized) [string]", async () => {
    const snapshot = await d2Snap(readFile("pizza"), Infinity, 0, 1.0, {
        debug: true
    });

    writeActual("pizza.lin", snapshot.serializedHtml);
    const expected = readExpected("pizza.lin");

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.33,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});