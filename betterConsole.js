module.exports = function(oldConsole, client, config) {
    this.log = function(message) {
        oldConsole.log(message);
    }
    this.warn = function(message) {
        oldConsole.warn(message);
        if(typeof message == "Error") { 
            var embed = {
                title: message.name,
                description: message.message,
                color: 0xFFFF00
            }
        } else {
            var embed = {
                title: "Warn:",
                description: message,
                color: 0xFFFF00
            }
        }
        for(var o of config.owners) {
            if(client.status == 0) client.fetchUser(o).then(u => {
                u.send({embed});
            }).catch(oldConsole.error);
        }
    }
    this.error = function(message) {
        oldConsole.error(message);
        if(typeof message == "Error") {
            var embed = {
                title: message.name,
                description: message.message,
                color: 0xFF0000
            }
        } else {
            var embed = {
                title: "Error:",
                description: message,
                color: 0xFF0000
            }
        }
        for(var o of config.owners) {
            if(client.status == 0) client.fetchUser(o).then(u => {
                u.send({embed});
            }).catch(oldConsole.error);
        }
    }
}