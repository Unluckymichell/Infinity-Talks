import express, {Request} from "express";
import cookie_parser from "cookie-parser";
import {join} from "path";
import {Logger} from "../Util/Logger";
import {router as discordOAuthRouter, getUserByAuthToken} from "./api/discord";
const LOGGER = new Logger(__filename);

export class WebServer {
    app: express.Application;

    constructor() {
        this.app = express();

        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
            this.app.use("/api/discord", discordOAuthRouter);
            this.app.use(cookie_parser());
            this.app.use((req, res, next) => {
                const r = req as Request & {user: any};
                if (req.cookies._dctoken) {
                    var user = getUserByAuthToken(req.cookies._dctoken);
                    if (user) {
                        r.user = user;
                        next();
                    } else res.redirect("/api/discord/login");
                } else res.redirect("/api/discord/login");
            });
            this.app.use(express.static(join(__dirname, "public")));
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
