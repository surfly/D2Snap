import { createReadStream } from "fs";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

import OpenAI from "openai";
import Anthropic, { toFile } from "@anthropic-ai/sdk";


const InteractiveElementTarget = z.object({
    elementDescription: z.string()
});


export class OpenAIAdapter {
    #model;
    #client;

    constructor(model, key) {
        this.#model = model;
        this.#client = new OpenAI({
            apiKey: key
        });
    }

    async #createFile(filePath) {
        const result = await this.#client.files
            .create({
                file: createReadStream(filePath),
                purpose: "vision",
            });

        return result.id;
    }

    async request(instructions, inputTask, inputSnapshot, interactiveElementTargetSchema) {
        if(!inputSnapshot?.type) throw new SyntaxError("Invalid snapshot argument");

        const res = await this.#client.responses
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
                                ? { type: "input_image", file_id: await this.#createFile(inputSnapshot.path), "detail": "high" }
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
            ?.text
            .replace(/^``` *json\s*/, "")
            .replace(/\s*```$/, "");
        const resObj = JSON.parse(resText);

        return resObj;          
    }
}

export class AnthropicAdapter {
    #model;
    #client;

    constructor(model, key) {
        this.#model = model;
        this.#client = new Anthropic({
            apiKey: key
        });
    }

    async #createFile(filePath) {
        const result = await this.#client.beta.files
            .upload({
                file: await toFile(
                    createReadStream(filePath),
                    undefined,
                    { type: "image/png" }
                ),
                betas: [ "files-api-2025-04-14" ],
            });

        return result.id;
    }

    async request(instructions, inputTask, inputSnapshot, interactiveElementTargetSchema) {
        if(!inputSnapshot?.type) throw new SyntaxError("Invalid snapshot argument");

        const schema = z.object({
            interactiveElements: z.array(
                z.object({
                    ...InteractiveElementTarget.shape,
                    ...interactiveElementTargetSchema.shape
                })
            ),
        });

        const res = await this.#client.messages
            .create({
                max_tokens: 2**13,
                model: this.#model,
                system: instructions
                    .concat([
                        `Respond only with a valid JSON which is according to the following schema:\n\n${
                            JSON.stringify(
                                zodToJsonSchema(schema),
                                null,
                                2
                            )
                        }`
                    ])
                    .join("\n\n"),
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: [ "TASK:", inputTask ].join(" ") },
                            (inputSnapshot.type === "image")
                                /* ? { type: "image", source: { type: "file", file_id: await this.#createFile(inputSnapshot.path) } } */
                                ? { type: "image", source: { type: "base64", data: inputSnapshot.data, media_type: "image/png" } }
                                : { type: "text", text: inputSnapshot.data }
                        ]
                    }
                ]
            });

        if(res.error) throw res.error;

        const resText = res
            ?.content[0]
            ?.text
            .replace(/^``` *json\s*/, "")
            .replace(/\s*```$/, "");
        const resObj = JSON.parse(resText);

        schema.parse(resObj);

        return resObj;          
    }
}