import express, {Request} from "express";
import cookie_parser from "cookie-parser";
import {join} from "path";
import {LOGGER} from "../Util/Logger";
import {discordUserMiddleware, router as discordOAuthRouter} from "./api/discordOAuth";
import {router as discordInfTalksRouter} from "./api/inftalks";
import {Main, projectRoot} from "../Main";
import Eris from "eris";

export class WebServer {
    app: express.Application;
    bot: Eris.Client = Main.instance.bot;

    constructor() {
        this.app = express();

        const cache300_handler = (_r: any, r: any, n: any) =>
            r.set("Cache-control", "public, max-age=300") && n();
        const noUserRedir_handler = (rq: any, rs: any, n: any) =>
            rq.user ? n() : rs.redirect("/api/discord/login");

        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REDIRURL) {
            this.app.use("/favicon.ico", (_r, r) => r.redirect(this.bot.user.avatarURL));
            this.app.use("/api/discord", discordOAuthRouter);
            this.app.use("/", cookie_parser());
            this.app.use("/", discordUserMiddleware);
            this.app.use("/api", express.json());
            this.app.use("/api/inftalks", cache300_handler, discordInfTalksRouter);
            this.app.use("/", noUserRedir_handler, express.static(join(projectRoot, "web")));
            this.app.use("/", (_r, r) => r.status(404).send("404 - Not Found!"));

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
