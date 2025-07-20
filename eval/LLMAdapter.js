import { createReadStream } from "fs";

import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";

import OpenAI from "openai";
import Anthropic, { toFile } from "@anthropic-ai/sdk";

import { Logger } from "./Logger.js";


const InteractiveElementTarget = z.object({
    elementDescription: z.string()
});


class LLMAdapter {
    static #logger = new Logger("llm");
    static #requests = 0;

    createRequest(
        instructions,
        inputTask,
        snapshotData,
        interactiveElementTargetSchema
    ) {
        throw new SyntaxError("createRequest() not implemented");
    }

    createResponse(req) {
        throw new SyntaxError("createResponse() not implemented");
    }

    async request(...args) {
        const req = await this.createRequest(...args);
        const res = await this.createResponse(req);

        LLMAdapter.#logger
            .write(
                `${LLMAdapter.#requests++}.txt`,
                [
                    "REQUEST:",
                    JSON.stringify(req, null, 2),
                    "-".repeat(10),
                    "RESPONSE:",
                    JSON.stringify(res, null, 2)
                ].join("\n")
            );

        return res;          
    }
}


export class OpenAIAdapter extends LLMAdapter {
    #client;
    #model;

    constructor(model, key) {
        super();

        this.#model = model;
        this.#client = new OpenAI({
            apiKey: key
        });;
    }

    async #createFile(filePath) {
        const result = await this.#client.files
            .create({
                file: createReadStream(filePath),
                purpose: "vision",
            });

        return result.id;
    }

    async createRequest(
        instructions,
        inputTask,
        snapshotData,
        interactiveElementTargetSchema) {
        return {
            model: this.#model,
            input: [
                {
                    role: "developer",
                    content: [
                        {
                            type: "input_text",
                            text: instructions
                        }
                    ]
                },
                {
                    role: "user",
                    content: [
                        { type: "input_text", text: [ "TASK:", inputTask ].join(" ") },
                        ... await Promise.all(
                            snapshotData
                                .map(async (snapshot) => {
                                    return (snapshot.type === "image")
                                        ? { type: "input_image", file_id: await this.#createFile(snapshot.path), "detail": "high" }
                                        : { type: "input_text", text: snapshot.data };
                                })
                        )
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
        };
    }

    async createResponse(req) {
        const res = await this.#client
            .responses
            .create(req);

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

export class AnthropicAdapter extends LLMAdapter {
    #model;
    #client;

    constructor(model, key) {
        super();

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

    async createRequest(instructions, inputTask, snapshotData, interactiveElementTargetSchema) {
        const schema = z.object({
            interactiveElements: z.array(
                z.object({
                    ...InteractiveElementTarget.shape,
                    ...interactiveElementTargetSchema.shape
                })
            ),
        });

        return {
            max_tokens: 2**13,
            model: this.#model,
            system: [ instructions ]
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
                        ... await Promise.all(
                            snapshotData
                                .map(async (snapshot) => {
                                    return (snapshot.type === "image")
                                        /* ? { type: "image", source: { type: "file", file_id: await this.#createFile(inputSnapsshot.path) } } */
                                        ? { type: "image", source: { type: "base64", data: snapshot.data, media_type: "image/png" } }
                                        : { type: "text", text: snapshot.data };
                                })
                        )
                    ]
                }
            ]
        };
    }

    async createResponse(req) {
        const res = await this.#client.messages
            .create(req);

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