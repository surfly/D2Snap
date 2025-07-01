import { readFileSync } from "fs";
import { join } from "path";

import { z } from "zod";

import { runEvaluation } from "./eval.js";


const GUIInteractiveElementTarget = z.object({
    x: z.number(),
    y: z.number()
});


runEvaluation(
    "results.gui",
    (id) => {
        const path = join(import.meta.dirname, "dataset", "gui", `${id}.png`);
        const data = readFileSync(path);
        const byteSize = Buffer.byteLength(readFileSync(path));

        return {
            type: "image",
            data: Buffer.from(data).toString("base64"),
            path: path,
            size: byteSize,
            estimatedTokens: Math.round(byteSize / (32**2)),    // according to https://platform.openai.com/docs/guides/images-vision?api-mode=responses#calculating-costs
        };
    },
    (res, reference) => {
        for(let trajectory of reference.trajectories) {
            if(res.length < trajectory.length) continue;

            let matchesTrajectory = true;
            for(let referenceElement of trajectory) {
                let matchesElement = false;
                for(let resElement of res) {
                    if(!referenceElement.bounding_box) continue;

                    const TOLERANCE_OFFSET = 10;
                    if(
                           resElement.x >= (referenceElement.bounding_box[0][0] - TOLERANCE_OFFSET)
                        && resElement.x <= (referenceElement.bounding_box[1][0] + TOLERANCE_OFFSET)
                        && resElement.y >= (referenceElement.bounding_box[0][1] - TOLERANCE_OFFSET)
                        && resElement.y <= (referenceElement.bounding_box[1][1] + TOLERANCE_OFFSET)
                    ) {
                        matchesElement = true;

                        break;
                    }
                }

                if(matchesElement) continue;

                matchesTrajectory = false;

                break;
            }

            if(matchesTrajectory) return true;
        }

        return false;
    },
    GUIInteractiveElementTarget,
    "gui"
);