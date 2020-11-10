import express, {Request} from "express";
import cookie_parser from "cookie-parser";
import {join} from "path";
import {Logger} from "../Util/Logger";
import {discordUserMiddleware, router as discordOAuthRouter} from "./api/discordOAuth";
import {router as discordInfTalksRouter} from "./api/inftalks";
import {projectRoot} from "../Main";
const LOGGER = new Logger(__filename);

export class WebServer {
    app: express.Application;

    constructor() {
        this.app = express();

        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REDIRURL) {
            this.app.use("/api/discord", discordOAuthRouter);
            this.app.use(cookie_parser());
            this.app.use(discordUserMiddleware);
            this.app.use(express.static(join(projectRoot, "web"), {}));
            this.app.use(express.json());
            this.app.use("/api/inftalks", discordInfTalksRouter);
            //this.app.use((_r, r, n) => r.set("Cache-control", "public, max-age=300") && n());
            this.app.use((_r, r) => r.status(404).send("404 - Not Found!"));
            try {
                this.app.listen(process.env.PORT || 80, () => {
                    LOGGER.log(
                        `... Listening on ${
                            !process.env.PORT
                                ? "default port 80! Specify env var PORT to change"
                                : process.env.PORT
                        }`
                    );
                });
            } catch (err) {
                LOGGER.error(err);
            }
        } else {
            LOGGER.warn(
                "... Running without webserver! Required env vars: CLIENT_ID, CLIENT_SECRET, REDIRURL"
            );
        }
    }
}
