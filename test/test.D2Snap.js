import { join } from "path";
import { readFileSync, writeFileSync } from "fs";

import { takeSnapshot, takeAdaptiveSnapshot } from "../dist/D2Snap.lib.js";


function path(fileName) {
    return join(import.meta.dirname, `${fileName}.html`);
}

function readFile(fileName) {
    return readFileSync(path(fileName)).toString();
}

function readExpected(domName) {
    return readFile(`${domName}.expected`);
}

function writeActual(domName, html) {
    return writeFileSync(path(`${domName}.actual`), html);
}

function flattenDOMSnapshot(snapshot) {
    return snapshot.trim().replace(/\s+/g, "");
}


await test("Take adaptive DOM snapshot (4096)", async () => {
    const snapshot = await takeAdaptiveSnapshot(readFile("agents"), 4096, 5, {
        debug: true,
        assignUniqueIDs: true
    });

    writeActual("agents.4096", snapshot.serializedHtml);

    assertLess(
        snapshot.serializedHtml.length / 4,
        4096,
        "Invalid adaptive DOM snapshot size"
    );

    assertLess(
        2048,
        snapshot.serializedHtml.length,
        "Invalid adaptive DOM snapshot size"
    );

    assertIn(
        flattenDOMSnapshot(`<a data-uid="7">About</a>`),
        flattenDOMSnapshot(snapshot.serializedHtml),
        "Interactive element not preserved"
    );
});

await test("Take adaptive DOM snapshot (2048)", async() => {
    const snapshot = await takeAdaptiveSnapshot(readFile("agents"), 2048, 5, {
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

await test("Take DOM snapshot (L)", async () => {
    const snapshot = await takeSnapshot(readFile("pizza"), 2, 6, 0.375, {
        debug: true
    });

    writeActual("pizza.l", snapshot.serializedHtml);
    const expected = readExpected("pizza.l");

    assertAlmostEqual(
        snapshot.meta.originalSize,
        640,
        -1,
        "Invalid DOM snapshot original size"
    );

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.43,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});

await test("Take DOM snapshot (M)", async() => {
    const snapshot = await takeSnapshot(readFile("pizza"), 4, 4, 0.7, {
        debug: true
    });

    writeActual("pizza.m", snapshot.serializedHtml);
    const expected = readExpected("pizza.m");

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

await test("Take DOM snapshot (S)", async () => {
    const snapshot = await takeSnapshot(readFile("pizza"), 100, 2, 1.0, {
        debug: true
    });

    writeActual("pizza.s", snapshot.serializedHtml);
    const expected = readExpected("pizza.s");

    assertAlmostEqual(
        snapshot.meta.sizeRatio,
        0.26,
        2,
        "Invalid DOM snapshot size ratio"
    );

    assertEqual(
        flattenDOMSnapshot(snapshot.serializedHtml),
        flattenDOMSnapshot(expected),
        "Invalid DOM snapshot"
    );
});