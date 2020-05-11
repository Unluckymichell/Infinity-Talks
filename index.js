// Imports
const config = (
    require("fs").existsSync("./devConfig.json") ? 
    require("./devConfig.json") :
    require("./config.json")
)
const Discord = require("discord.js");
const client = new Discord.Client();
const langAll = require("./lang.json");
const database = require("./database.js");
const bconsole = require("./betterConsole.js");
const {generateEmbed, generateTalkName, utilSetConsole} = require("./util.js");

// Better console
console = new bconsole(console, client, config);
utilSetConsole(console);

// Startup message
console.log("Starting...");

// Initialise database and login to discord
database.init(console, __dirname + "/database.db", () => {
    client.login(config.token);
    database.output_database();
});

// Discord startup
client.on('ready', () => {
    console.log("Discord ready!");
    client.user.setPresence({
        game: {
            name: langAll.en.presenceMessage.replace(/<guildNum>/g, client.guilds.size),
            type: 'PLAYING'
        },
        status: 'online'
    });
});

// Discord errors
client.on("error", err => {
    console.log(err);
});

// Guild changes
client.on("guildCreate", guildCreateOrDelete);
client.on("guildDelete", guildCreateOrDelete);
function guildCreateOrDelete() {
    client.user.setPresence({
        game: {
            name: langAll.en.presenceMessage.replace(/<guildNum>/g, client.guilds.size),
            type: 'PLAYING'
        },
        status: 'online'
    });
}

// On message
client.on('message', message => {
    // Ignore bots
    if(message.author.bot) return;

    // Handle DM
    if(!message.guild) {
        // Special owner commands
        if(config.owners.includes(message.author.id)) {
            var args = message.content.split(/ +/g);
            var command = args.shift().toLowerCase();

            switch(command) {
                case "eval":
                    try {
                        var output = eval(args.join(" "));
                        message.author.send({embed: {
                            title: "Output:",
                            description: (output ? `${output}` : "null"),
                            color: 0x00FF00,
                            timestamp: new Date(),
                            footer: {
                                text: `@${message.author.username}`,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    } catch(error) {
                        message.author.send({embed: {
                            title: "Error:",
                            description: `${error}`,
                            color: 0xFF0000,
                            timestamp: new Date(),
                            footer: {
                                text: `@${message.author.username}`,
                                icon_url: message.author.displayAvatarURL
                            }
                        }});
                    }
                    
                    break;
            }
        }
        return;
    }

    database.getGuildSettings(message.guild.id, config.defaultGuildOptions, message.guild.name, (GS) => { onCommand(GS, message); });
});

function onCommand(options, message) {
    // Copy lang obj
    var lang = langAll[options.lang];

    // Return if no command
    if(message.content.replace("[PO->A]", "").replace("[PO->!A]", "").indexOf(options.prefix) != 0 ) return;

    // Permission overwrite
    var hasAdmin = message.member.hasPermission("ADMINISTRATOR");
    if(message.content.includes("[PO->A]") && config.owners.includes(message.author.id)) hasAdmin = true;
    if(message.content.includes("[PO->!A]") && config.owners.includes(message.author.id)) hasAdmin = false;

    // Parse command
    var argsRaw = [];
    var quote = false;
    var content = message.content.replace("[PO->A]", "").replace("[PO->!A]", "").slice(options.prefix.length).trim();
    var qSplit = content.split("\"")
    for(var i in qSplit) {
        if(!quote) {
            var sSplit = qSplit[i].split(/ +/g);
            for(var j in sSplit) {
                argsRaw.push(sSplit[j]);
            }
        } else {
            argsRaw.push(qSplit[i]);
        }
        quote = !quote;
    }
    var args = [];
    for(var a of argsRaw) {
        if(a != "") args.push(a);
    }
    var command = args.shift().toLowerCase();
    if(!command) return;
    command.toLowerCase();


    // Handle command
    switch(command) {
        case "help":
            if(!args[0]) message.channel.send(generateEmbed(lang.command.help.default, 0xFFA500, message.member, {"<prefix>": options.prefix}));
            else if(!lang.help[args[0].toLowerCase()]) message.channel.send(generateEmbed(lang.command.help.not_in_help_lib, 0xFF0000, message.member, {"<prefix>": options.prefix}));
            else message.channel.send(generateEmbed(lang.help[args[0].toLowerCase()], 0xFFA500, message.member, {"<prefix>": options.prefix, "<category>": options.categoryName}));
            break;
        
        case "lock":
            // Get category
            var category = message.guild.channels.find(c => c.type == "category" && c.name.toLowerCase() == options.categoryName.toLowerCase());
            if(!category) message.channel.send(generateEmbed(lang.feature_not_availabel, 0xFF0000, message.member, {})); // No category
            else if(!message.member.voiceChannel || !category.children.find(c => c.id == message.member.voiceChannel.id)) message.channel.send(generateEmbed(lang.command.lock.not_in_talk, 0xFF0000, message.member, {"<category>": options.categoryName})); // Not in talk
            else if(message.member.voiceChannel.userLimit > 0) message.channel.send(generateEmbed(lang.command.lock.already_locked, 0xFF0000, message.member, {"<prefix>": options.prefix})); // Allready locked
            else { // Success
                message.member.voiceChannel.setUserLimit(message.member.voiceChannel.members.size).then(() => { client.emit("voiceStateUpdate", message.member); });
                message.channel.send(generateEmbed(lang.command.lock.success, 0x00FF00, message.member, {"<talk>": message.member.voiceChannel.name}));
            }
            break;

        case "unlock":
            // Get category
            var category = message.guild.channels.find(c => c.type == "category" && c.name.toLowerCase() == options.categoryName.toLowerCase());
            if(!category) message.channel.send(generateEmbed(lang.feature_not_availabel, 0xFF0000, message.member, {})); // No category
            else if(!message.member.voiceChannel || !category.children.find(c => c.id == message.member.voiceChannel.id)) message.channel.send(generateEmbed(lang.command.unlock.not_in_talk, 0xFF0000, message.member, {"<category>": category.name})); // Not in talk
            else if(message.member.voiceChannel.userLimit < 1) message.channel.send(generateEmbed(lang.command.unlock.already_unlocked, 0xFF0000, message.member, {"<prefix>": options.prefix})); // Allready unlocked
            else { // Success
                message.member.voiceChannel.setUserLimit(0).then(() => { client.emit("voiceStateUpdate", message.member); }).catch(console.error);
                message.channel.send(generateEmbed(lang.command.unlock.success, 0x00FF00, message.member, {"<talk>": message.member.voiceChannel.name}));
            }
            break;
        
        case "quality":
            // Get category
            var category = message.guild.channels.find(c => c.type == "category" && c.name.toLowerCase() == options.categoryName.toLowerCase());
            if(!category) message.channel.send(generateEmbed(lang.feature_not_availabel, 0xFF0000, message.member, {})); // No category
            else if(!message.member.voiceChannel || !category.children.find(c => c.id == message.member.voiceChannel.id)) message.channel.send(generateEmbed(lang.command.quality.not_in_talk, 0xFF0000, message.member, {"<category>": category.name})); // Not in talk
            else if(args.length < 1) message.channel.send(generateEmbed(lang.command.quality.no_quality_arg, 0xFF0000, message.member, {"<prefix>": options.prefix})); // No quality arg
            else if(isNaN(parseFloat([args[0]]))) message.channel.send(generateEmbed(lang.command.quality.isNan, 0xFF0000, message.member, {"<prefix>": options.prefix})); // isNan
            else if(args[0] < 8 || args[0] > 96) message.channel.send(generateEmbed(lang.command.quality.number_not_in_range, 0xFF0000, message.member, {"<prefix>": options.prefix})); // number not in range
            else if(args.length > 1) message.channel.send(generateEmbed(lang.command.quality.to_many_args, 0xFF0000, message.member, {"<prefix>": options.prefix})); // To many args
            else { // Success
                message.member.voiceChannel.setBitrate(args[0]).then(() => { client.emit("voiceStateUpdate", message.member); }).catch(console.error);
                message.channel.send(generateEmbed(lang.command.quality.success, 0x00FF00, message.member, {"<quality>": args[0]})); }
            break;

        case "credits":
            message.channel.send(generateEmbed(lang.command.credits, 0xFFA500, message.member, {}));
            break;

        case "language":
        case "lang":
            if(!hasAdmin) message.channel.send(generateEmbed(lang.command.all.no_admin, 0xFF0000, message.member, {})); // No admin 
            else if(args.length < 1) message.channel.send(generateEmbed(lang.command.language.no_lang_arg, 0xFF0000, message.member, {"<prefix>": options.prefix})); // No lang arg
            else if(args.length > 1) message.channel.send(generateEmbed(lang.command.language.to_many_args, 0xFF0000, message.member, {"<prefix>": options.prefix})); // To many args
            else if (!langAll[args[0]]) message.channel.send(generateEmbed(lang.command.language.invalid_lang, 0xFF0000, message.member, {"<prefix>": options.prefix})); // Invalid lang
            else { // Success
                database.changeGuildSettings(message.guild.id, "lang", args[0], () => { // Change Language in db
                    message.channel.send(generateEmbed(langAll[args[0]].command.language.success, 0x00FF00, message.member, {"<lang>": args[0]}));
                });
            }
            break;

        case "langlist":
        case "langs":
            var text = lang.command.langlist.description1;
            for(var i in langAll) {
                text += lang.command.langlist.description2.replace(/<langname>/g, langAll[i].lang_name).replace(/<langcode>/g, i);
            }
            text += lang.command.langlist.description3.replace(/<prefix>/g, options.prefix)
            message.channel.send({embed: {
                title: lang.command.langlist.title,
                description: text,
                color: 0xFFA500
            }});
            break;
        
        case "prefix":
            if(!hasAdmin) message.channel.send(generateEmbed(lang.command.all.no_admin, 0xFF0000, message.member, {})); // No admin 
            else if(args.length < 1) message.channel.send(generateEmbed(lang.command.prefix.no_prefix_arg, 0xFF0000, message.member, {})); // No prefix arg
            else if(args.length > 1) message.channel.send(generateEmbed(lang.command.prefix.to_many_args, 0xFF0000, message.member, {"<prefix>": options.prefix})); // To many args
            else if (args[0].length > 8) message.channel.send(generateEmbed(lang.command.prefix.prefix_to_long, 0xFF0000, message.member, {})); // Prefix to long
            else { // Success
                database.changeGuildSettings(message.guild.id, "prefix", args[0], () => { // Change prefix in db
                    message.channel.send(generateEmbed(lang.command.prefix.success, 0x00FF00, message.member, {"<prefix>": args[0]}));
                });
            }
            break;

        case "talkcategory":
            if(!hasAdmin) message.channel.send(generateEmbed(lang.command.all.no_admin, 0xFF0000, message.member, {})); // No admin 
            else if(args.length < 1) message.channel.send(generateEmbed(lang.command.talkcategory.no_category_arg, 0xFF0000, message.member, {})); // No category arg 
            else if(args.length > 1) message.channel.send(generateEmbed(lang.command.talkcategory.to_many_args, 0xFF0000, message.member, {"<prefix>": options.prefix})); // To many args
            else {
                var channel = message.guild.channels.find(c => c.type == "category" && c.name.toLowerCase() == args[0].toLowerCase());
                if(!channel) message.channel.send(generateEmbed(lang.command.talkcategory.category_not_exist, 0xFF0000, message.member, {})); // Category not found
                else { // Success
                    database.changeGuildSettings(message.guild.id, "categoryName", args[0].toLowerCase(), () => { // Change categoryName in db
                        client.emit("voiceStateUpdate", message.member);
                        message.channel.send(generateEmbed(lang.command.talkcategory.success, 0x00FF00, message.member, {"<category>": args[0].toLowerCase()}));
                    });
                }
            }
            break;
        
        case "talknamerules":
            if(!hasAdmin) message.channel.send(generateEmbed(lang.command.all.no_admin, 0xFF0000, message.member, {})); // No admin 
            else if(args.length < 1) message.channel.send(generateEmbed(lang.command.talknamerules.no_rule_arg, 0xFF0000, message.member, {"<prefix>": options.prefix})); // No rule arg 
            else if(args.length > 1) message.channel.send(generateEmbed(lang.command.talknamerules.to_many_args, 0xFF0000, message.member, {"<prefix>": options.prefix})); // To many args
            else {
                database.changeGuildSettings(message.guild.id, "talkNameRules", args[0], () => { // Change talknamerules in db
                    client.emit("voiceStateUpdate", message.member);
                    message.channel.send(generateEmbed(lang.command.talknamerules.success, 0x00FF00, message.member, {"<rule>": args[0]}));
                });
            }
            break;
        
        default:
            message.channel.send(generateEmbed(lang.command.default, 0xFF0000, message.member, {"<prefix>": options.prefix}));
    }
}

// On voice state update
client.on('voiceStateUpdate', oldMember => {
    database.getGuildSettings(oldMember.guild.id, config.defaultGuildOptions, oldMember.guild.name, options => {
        // Copy lang obj
        //var lang = langAll[options.lang];

        // Get category (if undefined return)
        var category = oldMember.guild.channels.find(c => c.type == "category" && c.name.toLowerCase() == options.categoryName.toLowerCase());
        if(!category) return;

        // Sort and save channel list
        var channels = category.children.filter(c => c.type == "voice").sort((a, b) => {return a.position-b.position}).array();

        // Check if empty (create a voice channel)
        if(channels.length < 1) {
            oldMember.guild.createChannel(generateTalkName(options.talkNameRules, 1, false, config.bitrate.default), {
                type: "voice",
                bitrate: config.bitrate.default*1000
            }).then(newChannel => {
                newChannel.setParent(category.id);
            }).catch(console.error);
            return;
        }
        // Loop trough children
        var num = 1;
        for(var i=0; i<channels.length; i++) {
            if(i != channels.length-1) { // All voice channels except last
                if(channels[i].members.size < 1) {
                    channels[i].delete().catch(console.error);
                } else {
                    var name = generateTalkName(options.talkNameRules, num, channels[i].userLimit > 0,  channels[i].bitrate);
                    if(name != channels[i].name) channels[i].setName(name).catch(console.error);
                    if(channels[i].userLimit > 0 && channels[i].members.size != channels[i].userLimit) channels[i].setUserLimit(channels[i].members.size).catch(console.error);
                    num++;
                }
            } else { // Only last
                var name = generateTalkName(options.talkNameRules, num, channels[i].userLimit > 0,  channels[i].bitrate);
                if(name != channels[i].name) channels[i].setName(name).catch(console.error);
                num++;
                if(channels[i].members.size > 0) {
                    oldMember.guild.createChannel(generateTalkName(options.talkNameRules, num, false, config.bitrate.default), {
                        type: "voice",
                        position: channels[i].position+1,
                        bitrate: config.bitrate.default*1000
                    }).then(newChannel => {
                        newChannel.setParent(category.id);
                    }).catch(console.error);
                }
            }
        }
    });
});

