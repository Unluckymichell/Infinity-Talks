const Discord = require("discord.js");
const {generateEmbed, generateTalkName, utilSetConsole} = require("./util.js");

class CommandHandler {
    /**
     * Command handler
     * @param {*} options Guild options
     * @param {Discord.Message} message The recieved message object
     * @param {*} config Bot config
     * @param {*} langAll Full language object
     * @param {Discord.Client} client Dicord client object
     * @param {*} database Database object
     */
    constructor(config, langAll, client, database, bconsole) {
        this.config = config;
        this.langAll = langAll;
        this.client = client;
        this.database = database;
        console = bconsole;
        utilSetConsole(bconsole);
    }

    handleCommand(options, message) {
        // Fix my laziness
        var config = this.config;
        var langAll = this.langAll;
        var client = this.client;
        var database = this.database;

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
        var command = args.shift();
        if(!command) command = "";
        command = command.toLowerCase();
    
        // Execute command
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
            
            case "":
                message.channel.send("?");
                break;

            default:
                message.channel.send(generateEmbed(lang.command.default, 0xFF0000, message.member, {"<prefix>": options.prefix}));
        }
    }
}

/**
 * Command handler
 * @param {*} options Guild options
 * @param {Discord.Message} message The recieved message object
 * @param {*} config Bot config
 * @param {*} langAll Full language object
 * @param {Discord.Client} client Dicord client object
 */

module.exports = CommandHandler;