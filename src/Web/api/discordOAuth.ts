// TODO: Remove request, build with axios

import {NextFunction, Request, Response, Router} from "express";
import NodeCache from "node-cache";
export const router = Router();
import request from "request";
import config from "../../static.json";

export async function apiLoginRedirect(_req: Request, res: Response) {
    var v = vars();
    var url =
        "https://discordapp.com/api/oauth2/authorize" +
        `?client_id=${v.CLIENT_ID}` +
        "&scope=identify" +
        "&response_type=code" +
        `&redirect_uri=${v.REDIRECT_URI}`;
    res.redirect(url);
}

export async function apiCallback(req: Request, res: Response) {
    if (typeof req.query.code != "string") return res.end("Error: No Code!");
    var token = await oauth2Token(req.query.code);
    if (!token) return res.end("Error: No Token!");
    var user = await getUserByAuthToken(token);
    if (!user) return res.end("Error: No User!");
    res.cookie("_dctoken", token, {expires: new Date(Date.now() + 20 * 60 * 1000)});
    res.cookie("_dcid", user.id, {expires: new Date(Date.now() + 20 * 60 * 1000)});
    res.redirect("/");
}

router.get("/login", apiLoginRedirect);
router.get("/callback", apiCallback);

function vars() {
    return {
        REDIRECT_URI: process.env.REDIRURL || "",
        CLIENT_ID: process.env.CLIENT_ID || "",
        CLIENT_SECRET: process.env.CLIENT_SECRET || "",
    };
}

const userCache = new NodeCache({checkperiod: 30});
export async function discordUserMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies._dctoken || req.query._dctoken;
    if (token) {
        var user = userCache.get<discordUserResponse>(token) || null;
        if (user) {
            req.user = {...user, owner: config.owners.find(o => o._dcid == user?.id) ? true : false};
        } else {
            user = await getUserByAuthToken(token);
            if (user) {
                userCache.set(token, user, 60 * 30);
                req.user = {...user, owner: config.owners.find(o => o._dcid == user?.id) ? true : false};
            }
        }
    }
    next();
}

function oauth2Token(code: string) {
    return new Promise<string | null>(res => {
        var v = vars();
        request.post(
            {
                url: "https://discordapp.com/api/oauth2/token",
                form: {
                    client_id: v.CLIENT_ID,
                    client_secret: v.CLIENT_SECRET,
                    grant_type: "authorization_code",
                    code: code,
                    redirect_uri: v.REDIRECT_URI,
                    scope: "identify",
                },
            },
            (err, _r, body) => {
                if (err) res(null);
                else res(JSON.parse(body).access_token);
            }
        );
    });
}

interface discordUserResponse {
    id: string;
    username: string;
    avatar: string;
    discriminator: string;
}
async function getUserByAuthToken(token: string) {
    return new Promise<discordUserResponse | null>(res => {
        request.get(
            {
                url: "https://discordapp.com/api/users/@me",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            (err, _r, body) => {
                if (err) res(null);
                else res(JSON.parse(body));
            }
        );
    });
}
