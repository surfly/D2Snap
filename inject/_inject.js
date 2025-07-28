document
    .addEventListener("DOMContentLoaded", async() => {
        const presentSnapshot = (snapshot, parameters = null) => {
            console.log("-".repeat(25));
            console.log(snapshot.parameters ?? parameters);
            console.log(snapshot.meta);
            console.log(snapshot.serializedHtml);
        };

        console.log(document.body.innerHTML);

        presentSnapshot(
            await D2Snap.d2Snap(0.7, 0.7, 0.7, {
                debug: true
            }),
            { k: 0.7, l: 0.7, m: 0.7 }
        );
        presentSnapshot(
            await D2Snap.d2Snap(0.2, 0.4, 0.6, {
                debug: true
            }),
            { k: 0.2, l: 0.4, m: 0.6 }
        );
        presentSnapshot(
            await D2Snap.adaptiveD2Snap(undefined, undefined, {
                debug: true,
                assignUniqueIDs: true
            })
        );
    });