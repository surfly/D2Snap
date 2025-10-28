export async function dynamicizeDOM(domString) {
    if(typeof(domString) !== "string") return domString;

    try {
        const jsdom = await import("jsdom");

        const dynamicDOM = new jsdom.JSDOM(domString);

        return dynamicDOM.window.document;
    } catch(err) {
        if(err.code !== "ERR_MODULE_NOT_FOUND") throw err;

        throw new ReferenceError("Install 'jsdom' to use D2Snap with Node.js");
    }
}