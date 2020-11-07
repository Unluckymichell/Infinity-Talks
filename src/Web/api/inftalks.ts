import {CategoryChannel} from "eris";
import {Router} from "express";
import {catSchema, GuildModel} from "../../Database/models";
import {LANGLIST} from "../../Language/all";
import {Main} from "../../Main";
export const router = Router();

router.get("/guild/all", async (req, res) => {
    const bot = Main.instance.bot;
    if (!req.user) return;
    var joinedGuilds: any[] = [];

    for (const [, guild] of bot.guilds) {
        const members = await guild.fetchMembers({
            userIDs: [req.user.id],
        });
        const member = members.find(m => m.id == req.user?.id && m.permission.has("administrator"));
        if (member)
            joinedGuilds.push({
                guild: {
                    id: guild.id,
                    name: guild.name,
                },
            });
    }
    res.json(joinedGuilds);
});

router.get("/guild", async (req, res) => {
    const bot = Main.instance.bot;
    if (!req.user) return;
    if (typeof req.query.id != "string") return res.status(400).json({error: "No id!"});
    const gId = req.query.id;
    var guild = bot.guilds.find(g => g.id == gId);
    if (!guild) return res.status(400).json({error: "Wrong id!"});
    var member = guild.members.find(m => m.id == req.user!.id);
    if (!member) {
        member = (
            await guild.fetchMembers({
                userIDs: [req.user.id],
            })
        ).find(m => m.id == req.user?.id && m.permission.has("administrator"));
        if (!member) return res.status(400).json({error: "Wrong id!"});
    } else {
        if (!member.permission.has("administrator")) res.status(400).json({error: "No admin!"});
    }
    var gInfo = await GuildModel.findOne({_dcid: guild.id}); // Request guild information from db
    if (!gInfo) gInfo = await new GuildModel({_dcid: guild.id}).save(); // Save default if not found
    var categorys = [];
    for (var catInfo of gInfo.categorys) {
        var category = bot.getChannel(catInfo._dcid);
        if (!category) continue;
        if (category.type == 4) {
            categorys.push({
                id: category.id,
                name: category.name,
                enableInfTalks: catInfo.enableInfTalks,
                channelLimit: catInfo.channelLimit,
                channelUserLimit: catInfo.channelUserLimit,
                allowLock: catInfo.allowLock,
                namingRule: catInfo.namingRule,
            });
        }
    }
    var textChannels = [];
    for (var tcInfo of gInfo.textChannels) {
        var textChannel = bot.getChannel(tcInfo._dcid);
        if (!textChannel) continue;
        if (textChannel.type == 0) {
            textChannels.push({
                id: textChannel.id,
                name: textChannel.name,
                allowCommands: tcInfo.allowCommands,
                autoDelete: tcInfo.autoDelete,
                autoDeleteDelay: tcInfo.autoDeleteDelay,
            });
        }
    }
    res.json({
        langlist: LANGLIST,
        guild: {
            id: guild.id,
            name: guild.name,
            prefix: gInfo.prefix,
            language: gInfo.language,
            textChannels: textChannels,
            categorys: categorys,
        },
    });
});