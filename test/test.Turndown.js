import { KEEP_LINE_BREAK_MARK, turndown } from "../src/Turndown.ts";



function flattenCode(code) {
    return code
        .replace(/\n +/g, "\n")
        .trim()
}

await test("Turndown markup to markdown", async () => {
    const markdown = turndown(
        flattenCode(`
            <h1>Amsterdam</h1>
            <p>
                <strong>Amsterdam</strong> is the capital and largest city of the Kingdom of the Netherlands.
            <p>
            <blockquote>
                Amsterdam has a population of 933,680 in June 2024.
            </blockquote>
            <a href="#stats">Stats</a>
        `)
    );

    assertEqual(
        markdown,
        `${flattenCode(`
            # Amsterdam

            **Amsterdam** is the capital and largest city of the Kingdom of the Netherlands.

            > Amsterdam has a population of 933,680 in June 2024.

            <a href="#stats">Stats</a>
        `)}\n`
            .replace(/\n/g, KEEP_LINE_BREAK_MARK),
        "TextRank returns invalid results"
    );
});