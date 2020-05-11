function utilSetConsole(c) {
    console = c;
}

function generateEmbed(langEmbed, color, member, replacer) {
    var embed = {
        title: langEmbed.title,
        description: langEmbed.description,
        color: color,
        timestamp: new Date(),
	    footer: {
            text: `@${member.displayName}`,
		    icon_url: member.user.displayAvatarURL
        }
    }
    for(var i in replacer) {
        try {
            eval(`embed.description = embed.description.replace(/${i}/g, "${replacer[i]}");`);
        } catch(err) {
            console.error(err);
        }
    }
    return {embed};
}

function generateTalkName(rule, num, lock, quality) {
    return rule.replace("[lock_sym]", (lock ? "🔒" : "")).replace("[num]", num).replace("[quality]", quality);
}

module.exports = {
    utilSetConsole,
    generateEmbed,
    generateTalkName
}