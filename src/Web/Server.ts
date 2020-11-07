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

        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
            this.app.use("/api/discord", discordOAuthRouter);
            this.app.use(cookie_parser());
            this.app.use(discordUserMiddleware);
            this.app.use("/api/inftalks", discordInfTalksRouter);
            this.app.use(express.static(join(projectRoot, "web"), {}));
            this.app.use((_req, res) => res.status(404).send("404 - Not Found!"));
            try {
                this.app.listen(process.env.PORT || 80, () => {
                    LOGGER.log(`Listening on ${process.env.PORT || 80}`);
                });
            } catch (err) {
                LOGGER.error(err);
            }
        } else {
            LOGGER.warn("Running without webserver!");
        }
    }
}
