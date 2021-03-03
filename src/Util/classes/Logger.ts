import "source-map-support/register";
import {createWriteStream, PathLike, WriteStream} from "fs";
import {URL} from "url";
import WebSocket from "ws";

var useStdout = true,
    projectPath: string = __dirname,
    outWebSocketUrl: URL | string | null = null,
    outWebSocketReconnectTimeout: NodeJS.Timeout | null = null,
    outWebSocket: WebSocket | null = null,
    outStream: WriteStream | null = null,
    webSocketBuffer: Line[] = [],
    webSocketbufferMaxLineCount: number = 500;

// export const LOGGER = console;
export class LOGGER {
    private static formate(message: Error | string, type: string, includeTrace: boolean = false) {
        if (typeof message == "string") message = new Error(message);
        else message = new Error(message.message);

        var timestamp = new Date();
        var info = this.parseErrorStack(message.stack);
        if (info) {
            var relativePath = info.path.startsWith(projectPath) ? "." + info.path.replace(projectPath, "") : undefined;

            return `[${timestamp.toLocaleTimeString()}] [${type.toUpperCase()}] [${(relativePath ? relativePath : info.path).replace(/\\/g, "/")}:${
                info.line
            }:${info.col}] ${message.message}${includeTrace ? "\n" + info.trace : ""}`;
        } else {
            return `[${timestamp.toLocaleTimeString()}] [${type.toUpperCase()}] ${message.message}`;
        }
    }

    private static parseErrorStack(stack?: string) {
        if (!stack) return null;
        var traceLines = stack.split("\n") || ["", "", "(Unknown:0:0)"];
        for (let n = 0; n < 3; n++) traceLines.shift();
        var trace = traceLines.join("\n");
        if (traceLines.length < 1) return null;
        var location = traceLines[0].substring(traceLines[0].indexOf("(") + 1, traceLines[0].indexOf(")")).split(":");
        var col = location.pop();
        var line = location.pop();
        var path = location.join(":");
        return {trace, location, col, line, path};
    }

    public static println(message: string) {
        if (useStdout) console.info(message);
        if (outStream) outStream.write(message + "\n");
        if (outWebSocket && outWebSocket.readyState == outWebSocket.OPEN) outWebSocket.send(message + "\n");
        else if (webSocketBuffer.length <= webSocketbufferMaxLineCount) webSocketBuffer.push(message);
    }

    public static info(message: Error | string = "", includeTrace: boolean = false): void {
        message = LOGGER.formate(message, "info", includeTrace);
        LOGGER.println(message);
    }
    public static debug(message: Error | string = "", includeTrace: boolean = false): void {
        message = LOGGER.formate(message, "debug", includeTrace);
        LOGGER.println(message);
    }
    public static log(message: Error | string = "", includeTrace: boolean = false): void {
        message = LOGGER.formate(message, "log", includeTrace);
        LOGGER.println(message);
    }
    public static warn(message: Error | string = "", includeTrace: boolean = false): void {
        message = LOGGER.formate(typeof message == "string" ? new Error(message) : message, "warn", includeTrace);
        LOGGER.println(message);
    }
    public static error(message: Error | string = "", includeTrace: boolean = true): void {
        message = LOGGER.formate(typeof message == "string" ? new Error(message) : message, "error", includeTrace);
        LOGGER.println(message);
    }
}

export class Logger {
    info: (message?: string | Error, includeTrace?: boolean) => void;
    debug: (message?: string | Error, includeTrace?: boolean) => void;
    log: (message?: string | Error, includeTrace?: boolean) => void;
    warn: (message?: string | Error, includeTrace?: boolean) => void;
    error: (message?: string | Error, includeTrace?: boolean) => void;
    constructor() {
        this.info = LOGGER.info.bind(LOGGER);
        this.debug = LOGGER.debug.bind(LOGGER);
        this.log = LOGGER.log.bind(LOGGER);
        this.warn = LOGGER.warn.bind(LOGGER);
        this.error = LOGGER.error.bind(LOGGER);
    }
}

export function init(options: Options) {
    if (typeof options.projectPath == "string") projectPath = options.projectPath;
    if (typeof options.useStdout == "boolean") useStdout = options.useStdout;
    if (typeof options.outFile == "string" || Buffer.isBuffer(options.outFile)) {
        if (outStream) outStream.close();
        outStream = createWriteStream(options.outFile);
    }
    if (options.outWebSocket) {
        if (typeof options.outWebSocket.webSocketUrl == "string" || options.outWebSocket.webSocketUrl instanceof URL) {
            outWebSocketUrl = options.outWebSocket.webSocketUrl;
            webSocketbufferMaxLineCount = options.outWebSocket.bufferIfNotAvailabel ? options.outWebSocket.bufferMaxLineCount : 0;
            if (outWebSocket) outWebSocket.close();
            if (outWebSocketReconnectTimeout) clearTimeout(outWebSocketReconnectTimeout);
            connectWebSocket();
        }
    }
}

function connectWebSocket() {
    if (!outWebSocketUrl) return;
    outWebSocket = new WebSocket(outWebSocketUrl);
    outWebSocket.on("open", () => {
        webSocketBuffer.forEach(l => outWebSocket!.send(l + "\n"));
        webSocketBuffer = [];
        LOGGER.info("Logger Web Socket connected!");
    });
    outWebSocket.on("close", () => {
        if (outWebSocketReconnectTimeout) clearTimeout(outWebSocketReconnectTimeout);
        outWebSocketReconnectTimeout = null;
        LOGGER.warn("Logger Web Socket disconnected! (Reconnecting)");
        var reconnectFunction = () => {
            if (outWebSocketUrl) {
                LOGGER.warn("Logger Web Socket reconnecting...");
                connectWebSocket();
            } else outWebSocketReconnectTimeout = setTimeout(reconnectFunction, 5000);
        };
        outWebSocketReconnectTimeout = setTimeout(reconnectFunction, 5000);
    });
}

interface Options {
    projectPath?: string;
    useStdout?: boolean;
    outFile?: PathLike;
    outWebSocket?: {
        webSocketUrl: URL | string;
        bufferIfNotAvailabel: boolean;
        bufferMaxLineCount: number;
    };
}

type Line = string;
