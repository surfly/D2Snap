import { join } from "path";
import { readFileSync, writeFileSync } from "fs";
import { deepEqual as assertEqual, ok } from "assert";

import { takeSnapshot, takeAdaptiveSnapshot } from "../dist/D2Snap.lib.js";


process.on("exit", code => {
    code
        ? console.error(`\x1b[31mTest failed (exit code ${code}).\x1b[0m`)
        : console.log(`\x1b[32mTest succeeded.\x1b[0m`);
});


function assertLess(a, b, message) {
    return ok(a < b, message);
}

function assertIn(a, b, message) {
    return ok(b.includes(a), message);
}

function assertAlmostEqual(a, b, precision, message) {
    const roundPrecision = a => Math.round(a * 10**precision) / 10**precision;

    return assertEqual(roundPrecision(a), roundPrecision(b), message);
}

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

async function test(title, cb) {
    console.log(`\x1b[2m${title}\x1b[0m`);

    await cb();
}