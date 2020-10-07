export class StringGenerator {
    static instance: StringGenerator;
    constructor() {
        if (StringGenerator.instance) throw new Error("String generator multi instance");
        StringGenerator.instance = this;
    }
    /**
     * Syntax samples:
     * <if:$locked>🔒<else>🔓</if> Talk $pos
     *
     * @param vars Object containing all availabel variables
     * @param rule Base rule string that will be converted
     */
    build(vars: {[key: string]: string | number | boolean}, rule: string) {
        var out = rule;
        // Insert values
        for (const key in vars) {
            out = out.replace(new RegExp(`\\$${key}`, "g"), `${vars[key]}`);
        }

        // Blocks
        out = this.buildBlocks(out);
        return out;
    }

    buildBlocks(str: string) {
        const rest = str.split(/<if:.*?>.*?<\/if>/gi);
        const blocks = [];
        // Find if blocks
        var reg = /<if:.*?>.*?<\/if>/gi,
            res = reg.exec(str);
        // Loop if blocks
        while (null != res) {
            // Replace else key
            const block = res[0].replace("<else>", "%^&");
            const sections = block.split(/<|>/gi);
            var result1 = true;
            // Check correct formation
            if (sections.length == 5) {
                sections.shift(); // Remove ""
                sections.pop(); // Remove ""
                sections.pop(); // Remove "/if"
                var [, ...conditions1] = sections.shift()?.split(/:|&/gi);
                // Loop and conditions
                for (const condition1 of conditions1) {
                    var conditions2 = condition1.split(/\|/gi);
                    var result2 = false;
                    for (const condition of conditions2) {
                        var parts = condition.split("=");
                        if (parts.length == 1 && parts[0] == "true") result2 = true;
                        else if (parts.length == 2 && parts[0] == parts[1]) result2 = true;
                    }
                    if (!result2) result1 = false;
                }
                var out = sections[0].split("%^&");
                blocks.push(result1 ? out[0] || "" : out[1] || "");
            } else blocks.push("[Error: To many <>]");

            res = reg.exec(str);
        }
        var ret = "";
        while (rest.length > 0 || blocks.length > 0) {
            ret += (rest.shift() || "") + (blocks.shift() || "");
        }
        return ret;
    }
}
