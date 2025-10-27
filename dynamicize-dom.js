export async function dynamicizeDOM(domString) {
    if(typeof(domString) !== "string") return domString;

    try {
        const jsdom = await import("jsdom");

        const dynamicDOM = new jsdom.JSDOM(domString);

        return dynamicDOM.window.document;
    } catch(err) {
        console.error(err);

        throw new ReferenceError("Install 'jsdom' to use D2Snap with Node.js");
    }
}