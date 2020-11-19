import {NextFunction, Request, RequestHandler, Response, Router} from "express";
export const router = Router();
import request from "request";

router.get("/login", (_req, res) => {
    var v = vars();
    var url =
        "https://discordapp.com/api/oauth2/authorize" +
        `?client_id=${v.CLIENT_ID}` +
        "&scope=identify" +
        "&response_type=code" +
        `&redirect_uri=${v.REDIRECT_URI}`;
    res.redirect(url);
});

router.get("/callback", async (req, res) => {
    if (typeof req.query.code != "string") return res.end("/error?nocode");
    var token = await oauth2Token(req.query.code);
    if (!token) return res.redirect("/error?invalidtoken");
    var user = await getUserByAuthToken(token);
    if (!user) return res.end("/error?nouser");
    res.cookie("_dctoken", token, {expires: new Date(Date.now() + 20 * 60 * 1000)});
    res.cookie("_dcid", user.id, {expires: new Date(Date.now() + 20 * 60 * 1000)});
    res.redirect("/");
});

function vars() {
    return {
        REDIRECT_URI: process.env.REDIRURL || "",
        CLIENT_ID: process.env.CLIENT_ID || "",
        CLIENT_SECRET: process.env.CLIENT_SECRET || "",
    };
}

export async function discordUserMiddleware(req: Request, res: Response, next: NextFunction) {
    const r = req;
    if (req.cookies._dctoken || req.query._dctoken) {
        var user = await getUserByAuthToken(req.cookies._dctoken || req.query._dctoken);
        if (user) {
            r.user = user;
        }
    }
    next();
}

async function oauth2Token(code: string) {
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

async function getUserByAuthToken(token: string) {
    return new Promise<{
        id: string;
        username: string;
        avatar: string;
        discriminator: string;
    } | null>(res => {
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
