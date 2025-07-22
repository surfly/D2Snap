import { readFileSync } from "fs";
import { join } from "path";


const RAW_ARGS = [ undefined, ...process.argv.slice(2) ];


export const INSTRUCTIONS_TEMPLATE = readFileSync(join(import.meta.dirname, "instructions.template.md")).toString();


export const parseFlag = arg => !!~RAW_ARGS.indexOf(arg);
export const parseOption = arg => RAW_ARGS[RAW_ARGS.indexOf(arg) + 1];


export function print(message, always = false) {
    if(!always && !parseFlag("--verbose")) return;

    console.log(`\x1b[2m${message}\x1b[0m`);
}

export function templateInstructions(templatingDict) {
    let instructions = INSTRUCTIONS_TEMPLATE;

    const replaceTemplate = (template, markdown) => {
        instructions = instructions
            .replace(
                new RegExp(`\\{\\{ *${template} *\\}\\}`, "gi"),
                markdown.trim()
            );
    };

    Object.entries(templatingDict)
        .forEach(entry => replaceTemplate(entry[0], entry[1]));

    return instructions;
}

export function checkAgainstTrajectories(res, trajectories, checkCb) {
    for(let referenceTrajectory of trajectories) {
        if(res.length < referenceTrajectory.length) continue;

        let matchesTrajectory = true;
        for(let referenceElement of referenceTrajectory) {
            let matchesElement = false;
            for(let resElement of res) {
                matchesElement = checkCb(resElement, referenceElement);

                if(matchesElement) break;
            }

            if(matchesElement) continue;

            matchesTrajectory = false;

            break;
        }

        if(matchesTrajectory) return true;
    }

    return false;
}