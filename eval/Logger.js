import { join } from "path";
import { rmSync, mkdirSync, writeFileSync } from "fs";


export class Logger {
    static #logsDir = join(import.meta.dirname, "logs");

    #path;

    constructor(dir, cleanDir = true) {
        this.#path = join(Logger.#logsDir, dir);

        cleanDir
            && rmSync(this.#path, {
                recursive: true,
                force: true
            });
        try {
            mkdirSync(this.#path, {
                recursive: true
            });
        } catch { /**/ }
    }

    write(filename, data) {
        writeFileSync(join(this.#path, filename), data);
    }
}