import { join } from "path";
import { deepEqual as assertEqual, ok } from "assert";


global.assertEqual = assertEqual;

global.assertLess = function(a, b, message) {
    return ok(a < b, message);
}

global.assertIn = function(a, b, message) {
    return ok(b.includes(a), message);
}

global.assertAlmostEqual = function(a, b, precision, message) {
    const roundPrecision = a => Math.round(a * 10**precision) / 10**precision;

    return assertEqual(roundPrecision(a), roundPrecision(b), message);
}

global.path = function(fileName) {
    return join(import.meta.dirname, `${fileName}.html`);
}

global.test = async function(title, cb) {
    console.log(`\x1b[2m${title}\x1b[0m`);

    await cb();
}


process.on("exit", code => {
    code
        ? console.error(`\x1b[31mTests failed (exit code ${code}).\x1b[0m`)
        : console.log(`\x1b[32mTests succeeded.\x1b[0m`);
});


[
    "test.D2Snap",
    "test.TextRank",
    "test.Turndown"
]
    .forEach(async reference => {
        await import(join(import.meta.dirname, reference.replace(/(\.js)?$/i, ".js")));
    });