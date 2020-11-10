import {CategoryChannel} from "eris";
import {Router} from "express";
import {catSchema, GuildModel} from "../../Database/models";
import {LANGLIST} from "../../Language/all";
import {Main} from "../../Main";
export const router = Router();

router.get("/guild/all", async (req, res) => {
    const bot = Main.instance.bot;
    if (!req.user) return res.status(400).json({error: "No token!"});
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
    res.set("Cache-control", "public, max-age=30");
    res.json(joinedGuilds);
});

router.get("/guild", async (req, res) => {
    const bot = Main.instance.bot;
    if (!req.user) return res.status(400).json({error: "No token!"});
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
    res.set("Cache-control", `no-store`);
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

router.post("/guild", async (req, res) => {
    const bot = Main.instance.bot;
    if (!req.user) return res.status(400).json({error: "No token!"});
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

    // Verify data
    if (typeof req.body.guild != "object") return res.status(400).json({error: "Validation Error"});
    if (typeof req.body.guild.categorys != "object")
        return res.status(400).json({error: "Validation Error"});
    if (typeof req.body.guild.textChannels != "object")
        return res.status(400).json({error: "Validation Error"});
    var data = req.body;

    var gInfo = await GuildModel.findOne({_dcid: data.guild.id}); // Request guild information from db
    if (!gInfo) return res.status(400).json({error: "Wrong id!"});

    gInfo.language = data.guild.language;
    gInfo.prefix = data.guild.prefix;

    for (var cat of data.guild.categorys) {
        var category = gInfo.categorys.find(c => c._dcid == cat.id);
        if (category) {
            category.enableInfTalks = cat.enableInfTalks;
            category.channelLimit = cat.channelLimit;
            category.channelUserLimit = cat.channelUserLimit;
            category.allowLock = cat.allowLock;
            category.namingRule = cat.namingRule;
        }
    }

    for (var tcChannel of data.guild.textChannels) {
        var textChannel = gInfo.textChannels.find(tc => tc._dcid == tcChannel.id);
        if (textChannel) {
            textChannel.allowCommands = textChannel.allowCommands;
            textChannel.autoDelete = textChannel.autoDelete;
            textChannel.autoDeleteDelay = textChannel.autoDeleteDelay;
        }
    }

    var err = await new Promise<any>(res => gInfo!.validate(res));
    if (err) return res.status(400).json({error: err.message});

    await gInfo.save();
    res.json({success: true});
});
