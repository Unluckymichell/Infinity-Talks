export class ChannelNameGenerator {
    /**
     * Syntax samples:
     *
     * Conditinal Block: Talk $pos is <l>locked<l><ul>unlocked<ul>!
     * Insert val: $VAL
     *
     * @param vars Object containint all availabel variables
     * @param rule Base rule that will be converted
     */
    build(vars: {[key: string]: string | number | boolean}, rule: string) {
        var out = rule;
        // Insert values
        for (const key in vars) {
            out = out.replace(new RegExp(`\\$${key}`, "g"), `${vars[key]}`);
        }
        // Blocks
        for (const v in vars) {
            const vv = vars[v];
            if (typeof vv == "boolean") {
                out = this.buildBlock(out, v, vv);
            }
        }
        return out;
    }

    private buildBlock(str: string, name: string, bool: boolean) {
        var list = str.split(`<${name}>`);
        var active = false;
        var out = "";
        for (const s of list) {
            if (active) {
                if (bool) out += s;
            } else out += s;
            active = !active;
        }
        return out;
    }
}
