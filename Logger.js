const Discord = require("discord.js");

/**
 * ##########
 * #  🇪🇷🇷🇴🇷  #
 * ##########
 */

class Logger {
    /**
     * Discord console
     * @param {Discord.Client} client 
     */
    constructor(client) {
        this.client = client;
        /**@type {Discord.User[]} */
        this.logTo = [];
        /**@type {Discord.User[]} */
        this.errorsTo = [];
    }

    /**
     * Add a user to pipe the log
     * @param {string} 
     */
    addLogTo(id) {
        this.logTo.push(id);
    }

    /**
     * Add a user to pipe errors
     * @param {string} 
     */
    addErrorsTo(id) {
        this.errorsTo.push(id);
    }

    log(any) {
        var stringified = null;
        if(!any) return;
        else if(any.stack) stringified = any.stack;
        else if(any.message) stringified = any.message;
        else if(any.toString) stringified = any.toString();
        else stringified = `${any}`;

        console.log(any);
        for (const user of this.logTo) {
            this.client.users
            .fetch(user, true).then(u => 
                u.createDM().then(c => 
                    c.send({embed: {
                        description: "```" + stringified + "```",
                        color: 0xFFFFFF
                    }
            })));
        }
    }


    warn(any) {
        var stringified = null;
        if(!any) return;
        else if(any.stack) stringified = any.stack;
        else if(any.message) stringified = any.message;
        else if(any.toString) stringified = any.toString();
        else stringified = `${any}`;

        console.warn(any);
        for (const user of this.errorsTo) {
            this.client.users
            .fetch(user, true).then(u => 
                u.createDM().then(c => 
                    c.send({embed: {
                        description: "```" + stringified + "```",
                        color: 0xFFA500
                    }
            })));
        }
    }
    
    error(any) {
        var stringified = null;
        if(!any) return;
        else if(any.stack) stringified = any.stack;
        else if(any.message) stringified = any.message;
        else if(any.toString) stringified = any.toString();
        else stringified = `${any}`;

        console.error(any);
        for (const user of this.errorsTo) {
            this.client.users
            .fetch(user, true).then(u => 
                u.createDM().then(c => 
                    c.send({embed: {
                        description: "```" + stringified + "```",
                        color: 0xFF0000
                    }
            })));
        }
    }

}

module.exports = Logger;