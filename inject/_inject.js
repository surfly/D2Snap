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
            await D2Snap.d2Snap(2, 5, 0.375, {
                debug: true
            }),
            { k: 2, l: 5, m: 0.375 }
        );
        presentSnapshot(
            await D2Snap.d2Snap(4, 2, 0.6, {
                debug: true
            }),
            { k: 4, l: 2, m: 0.6 }
        );
        presentSnapshot(
            await D2Snap.adaptiveD2Snap(undefined, undefined, {
                debug: true,
                assignUniqueIDs: true
            })
        );
    });