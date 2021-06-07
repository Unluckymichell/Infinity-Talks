import express from "express";
import cookie_parser from "cookie-parser";
import {join} from "path";
import {LOGGER} from "../Util/classes/Logger";
import {apiCallback as discordApiCallback, discordUserMiddleware, router as discordOAuthRouter} from "./api/discordOAuth";
import {router as discordInfTalksRouter} from "./api/inftalks";
import {Main, projectRoot} from "../Main";
import Eris from "eris";

export class WebServer {
    app: express.Application;
    bot: Eris.Client = Main.instance.bot;

    constructor() {
        this.app = express();

        const noUser_forbidden_handler: express.RequestHandler = (rq, rs, n) => (rq.user ? n() : rs.status(403).end("403 - Forbidden"));
        const notFound_handler: express.RequestHandler = (_r, r) => r.status(404).end("404 - Not Found");

        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.REDIRURL) {
            const REDIRURL_parsed = new URL(process.env.REDIRURL);
            this.app.use("/favicon.ico", (_r, r) => r.redirect(this.bot.user.avatarURL));
            this.app.use(REDIRURL_parsed.pathname, discordApiCallback);
            this.app.use("/api/discord", discordOAuthRouter);
            this.app.use("/", express.static(join(projectRoot, "web"), {maxAge: 300}));
            this.app.use("/", cookie_parser(), discordUserMiddleware, noUser_forbidden_handler, express.json());
            this.app.use("/api/inftalks", discordInfTalksRouter);
            this.app.use("/", notFound_handler);
            try {
                this.app.listen(process.env.PORT || 80, () =>
                    LOGGER.log(`... Listening on ${!process.env.PORT ? 'default port 80! Specify env var "PORT" to change' : process.env.PORT}`)
                );
            } catch (err) {
                LOGGER.error(err);
                LOGGER.log(`... Running without webserver due to error!`);
            }
        } else {
            LOGGER.warn("... Running without webserver! Required env vars: CLIENT_ID, CLIENT_SECRET, REDIRURL");
        }
    }
}
