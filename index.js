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
const CommandHandler = require("./commands.js");
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

// Initialise command handler
const commandHandler = new CommandHandler(config, langAll, client, database, console);

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

    database.getGuildSettings(message.guild.id, config.defaultGuildOptions, message.guild.name, (GS) => { 
        commandHandler.handleCommand(GS, message); 
    });
});

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
                    }).then(c => 
                        c.setParent(category.id).then(c => 
                            c.lockPermissions()
                        )
                    ).catch(console.error);
                }
            }
        }
    });
});

