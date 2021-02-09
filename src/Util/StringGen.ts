export class StringGenerator {
    /**
     * Syntax samples:
     * <if:$locked>🔒<else>🔓</if> Talk $pos
     *
     * @param vars Object containing all availabel variables
     * @param rule Base rule string that will be converted
     */
    static build(vars: {[key: string]: string | number | boolean | Function}, rule: string) {
        var out = rule;
        // Vars
        out = StringGenerator.buildVars(vars, out);

        // Function
        out = StringGenerator.buildFunctions(vars, out);

        // Blocks
        out = StringGenerator.buildBlocks(out);

        // Return
        return out.trim();
    }

    static buildVars(vars: {[key: string]: string | number | boolean | Function}, rule: string) {
        var out = rule;
        for (const key in vars) {
            if (typeof key != "object")
                // Insert values
                out = out.replace(new RegExp(`\\$${key}`, "g"), `${vars[key]}`);
        }
        return out;
    }

    static buildFunctions(
        vars: {[key: string]: string | number | boolean | Function},
        rule: string
    ) {
        var out = rule;
        for (var key in vars) {
            var f = vars[key];
            if (typeof f == "function") {
                // Loop functions
                var fr = new RegExp(`\\^(${key})*? {0,1}\\(.*?\\)`, "gi"); // ^func(value)
                var res = out.match(fr);
                while (res != null) {
                    var values = res[0].split(/\(|\)/gi);
                    values.shift();
                    values.pop();
                    var ret = "";
                    try {
                        ret = f(...values);
                    } catch (err) {
                        ret = err.message;
                    }
                    out = out.replace(res[0], ret);
                    res = out.match(fr);
                }
            }
            out = out.replace(new RegExp(`\\$${key}`, "g"), `${vars[key]}`);
        }
        return out;
    }

    static buildBlocks(rule: string) {
        const rest = rule.split(/<if:.*?>.*?<\/if>/gi);
        const blocks = [];
        // Find if blocks
        var reg = /<if:.*?>.*?<\/if>/gi,
            res = reg.exec(rule);
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
                var condition0 = sections.shift();
                if (typeof condition0 != "undefined") {
                    var [, ...conditions1] = condition0.split(/:|&/gi);
                    // Loop and conditions
                    for (const condition1 of conditions1) {
                        var conditions2 = condition1.split(/\|/gi);
                        var result2 = false;
                        for (const condition of conditions2) {
                            var parts = condition.split("=");
                            if (parts.length == 1 && parts[0].toLowerCase() == "true")
                                result2 = true;
                            else if (parts.length == 2 && parts[0] == parts[1]) result2 = true;
                        }
                        if (!result2) result1 = false;
                    }
                }
                var out = sections[0].split("%^&");
                blocks.push(result1 ? out[0] || "" : out[1] || "");
            } else blocks.push("[Error: To many <>]");
            res = reg.exec(rule);
        }
        // Combine secions
        var ret = "";
        while (rest.length > 0 || blocks.length > 0) {
            ret += (rest.shift() || "") + (blocks.shift() || "");
        }
        return ret;
    }
}
