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

export class LOGGER {
    private static formate(message: Error | string, type: string, includeTrace: boolean = false) {
        var timestamp = new Date();
        if (typeof message == "string") {
            return `[${timestamp.toLocaleTimeString()}] [${type.toUpperCase()}] ${message}`;
        } else {
            var traceLines = message.stack?.split("\n") || ["(Unknown:0:0)"];
            traceLines.shift();
            traceLines.shift();
            var trace = traceLines.join("\n");
            var location = traceLines[0].substring(traceLines[0].indexOf("(") + 1, traceLines[0].indexOf(")")).split(":");
            var col = location.pop();
            var line = location.pop();
            var path = location.join(":");
            var relativePath = path.startsWith(projectPath) ? "." + path.replace(projectPath, "") : undefined;
            if (relativePath && relativePath.length > 20) relativePath = relativePath.substring(relativePath.length - 20, relativePath.length);

            return `[${timestamp.toLocaleTimeString()}] [${type.toUpperCase()}] [${relativePath ? relativePath : path}:${line}:${col}] ${
                message.message
            }${includeTrace ? "\n" + trace : ""}`;
        }
    }

    static println(message: string) {
        if (useStdout) console.info(message);
        if (outStream) outStream.write(message + "\n");
        if (outWebSocket && outWebSocket.readyState == outWebSocket.OPEN) outWebSocket.send(message + "\n");
        else if (webSocketBuffer.length <= webSocketbufferMaxLineCount) webSocketBuffer.push(message);
    }

    static info(message: Error | string = ""): void {
        message = LOGGER.formate(message, "info");
        LOGGER.println(message);
    }
    static debug(message: Error | string = ""): void {
        message = LOGGER.formate(message, "debug");
        LOGGER.println(message);
    }
    static log(message: Error | string = ""): void {
        message = LOGGER.formate(message, "log");
        LOGGER.println(message);
    }
    static warn(message: Error | string = "", includeTrace: boolean = false): void {
        message = LOGGER.formate(typeof message == "string" ? new Error(message) : message, "warn", includeTrace);
        LOGGER.println(message);
    }
    static error(message: Error | string = "", includeTrace: boolean = true): void {
        message = LOGGER.formate(typeof message == "string" ? new Error(message) : message, "error", includeTrace);
        LOGGER.println(message);
    }
}

export class Logger {
    info: (message?: string | Error) => void;
    debug: (message?: string | Error) => void;
    log: (message?: string | Error) => void;
    warn: (message?: string | Error, includeTrace?: boolean) => void;
    error: (message?: string | Error, includeTrace?: boolean) => void;
    constructor() {
        this.info = LOGGER.info;
        this.debug = LOGGER.debug;
        this.log = LOGGER.log;
        this.warn = LOGGER.warn;
        this.error = LOGGER.error;
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
