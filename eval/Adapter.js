import { createReadStream } from "fs";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";


const InteractiveElementTarget = z.object({
    elementDescription: z.string()
});


export class OpenAIAdapter {
    #model;
    #endpoint;

    constructor(model, key) {
        this.#model = model;
        this.#endpoint = new OpenAI({
            apiKey: key
        });
    }

    async #createFile(filePath) {
        const result = await this.#endpoint.files
            .create({
                file: createReadStream(filePath),
                purpose: "vision",
            });

        return result.id;
    }

    async request(instructions, inputTask, inputSnapshot, interactiveElementTargetSchema) {
        if(!inputSnapshot?.type) throw new SyntaxError("Invalid snapshot argument");

        const res = await this.#endpoint.responses
            .create({
                model: this.#model,
                input: [
                    {
                        role: "developer",
                        content: [
                            ...instructions.map(instruction => {
                                return { type: "input_text", text: instruction };
                            })
                        ]
                    },
                    {
                        role: "user",
                        content: [
                            { type: "input_text", text: [ "TASK:", inputTask ].join(" ") },
                            (inputSnapshot.type === "image")
                                ? { type: "input_image", file_id: await this.#createFile(inputSnapshot.data) }
                                : { type: "input_text", text: inputSnapshot.data }
                        ]
                    }
                ],
                text: {
                    format: zodTextFormat(
                        z.object({
                            interactiveElements: z.array(
                                z.object({
                                    ...InteractiveElementTarget.shape,
                                    ...interactiveElementTargetSchema.shape
                                })
                            ),
                        }),
                        "interactiveElements"
                    )
                },
                store: false
            });

        if(res.error) throw res.error;

        const resText = res
            .output[0]
            ?.content[0]
            ?.text;
        let resObj;
        try {
            resObj = JSON.parse(resText);
        } catch { /* */ }

        return (resObj ?? resText) ?? "";          
    }
}