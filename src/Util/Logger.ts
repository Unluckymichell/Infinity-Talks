import {createWriteStream, WriteStream} from "fs";
import {join} from "path";
import {projectRoot} from "../Main";
import {logger} from "../config.json";

var logWriteStream: WriteStream;
if (logger.logFile) logWriteStream = createWriteStream(join(projectRoot, logger.logFile));

export class Logger {
    static instance: Logger;
    private filename: string;

    constructor(filename: string) {
        const file = filename.replace(projectRoot, "").replace(/^\/build/gi, "");
        this.filename = file
            .substr(
                file.length - logger.fileNameMaxLength > 0
                    ? file.length - logger.fileNameMaxLength
                    : 0,
                logger.fileNameMaxLength
            )
            .padEnd(logger.fileNameMaxLength, " ");
    }

    debug(message: any) {
        if (logger.logLevel == "debug") {
            const msg = `${this.timestamp()} ${this.filename} [dbg] ${message}`;
            if (logWriteStream && !logWriteStream.destroyed) logWriteStream.write(`${msg}\n`);
            console.log(msg);
        }
    }

    logJSON(message: any, pretty: boolean = true) {
        if (logger.logLevel == "debug") {
            var msg;
            try {
                msg = `${this.timestamp()} ${this.filename} [json]${
                    pretty ? "\n" : " "
                }${JSON.stringify(message, null, pretty ? 2 : undefined)}`;
            } catch (err) {
                this.error(` [json] ${err}`);
                return;
            } finally {
                if (logWriteStream && !logWriteStream.destroyed) logWriteStream.write(`${msg}\n`);
                console.log(msg);
            }
        }
    }

    log(message: any) {
        if (logger.logLevel == "log" || logger.logLevel == "debug") {
            const msg = `${this.timestamp()} ${this.filename} [info] ${message}`;
            if (logWriteStream && !logWriteStream.destroyed) logWriteStream.write(`${msg}\n`);
            console.log(msg);
        }
    }

    warn(message: any) {
        if (logger.logLevel == "warn" || logger.logLevel == "log" || logger.logLevel == "debug") {
            const msg = `${this.timestamp()} ${this.filename} [warn] ${message}`;
            if (logWriteStream && !logWriteStream.destroyed) logWriteStream.write(`${msg}\n`);
            console.warn(msg);
        }
    }

    error(message: any) {
        if (
            logger.logLevel == "error" ||
            logger.logLevel == "warn" ||
            logger.logLevel == "log" ||
            logger.logLevel == "debug"
        ) {
            const msg = `${this.timestamp()} ${this.filename} [err] ${message}`;
            if (logWriteStream && !logWriteStream.destroyed) logWriteStream.write(`${msg}\n`);
            console.error(msg);
        }
    }

    private timestamp() {
        return new Date().toLocaleTimeString([], {hour12: false}).padEnd(8, " ");
    }
}
