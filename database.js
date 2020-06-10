// Imports
const sqlite3 = require('sqlite3').verbose();
var db = null;

class Database {
    constructor (client, path) {
        this.client = client;
        this.logger = this.client.logger;
        this.path = path;
    }
    
    init(callback) {
        this.db = new sqlite3.Database(this.path, (err) => {
            if (err) this.logger.error(err);
            this.db.run(`
            CREATE TABLE IF NOT EXISTS "data" (
                "id"	        TEXT NOT NULL,
                "prefix"	    TEXT NOT NULL,
                "servername"    TEXT NOT NULL,
                "lang"	        TEXT NOT NULL,
                "categoryName"	BLOB NOT NULL,
                "talkNameRules"	BLOB NOT NULL,
                PRIMARY KEY("id")
            );`, err => {
                if(err) this.logger.error(err);
                else callback();
            });
        });
    }

    getGuildSettings(qid, defaultGs, guildName, callback) {
        this.db.get(`
            SELECT *
            FROM "data"
            WHERE id = ?;
        `, [qid], function (err, gs) {
            if(err) this.logger.error(err);
            if(gs) callback(gs);
            else {
                this.db.run(`
                    INSERT INTO "data"
                    VALUES (?, ?, ?, ?, ?, ?);
                `, [qid, defaultGs.prefix, guildName, defaultGs.lang, defaultGs.categoryName, defaultGs.talkNameRules], function (err) {
                    if(err) this.logger.error(err);
                    callback(defaultGs);
                });
            }
        });
    }

    changeGuildSettings(qid, key, value, callback) {
        this.db.run(`
            UPDATE "data"
            SET ${key} = ?
            WHERE id = ?;
        `, [value, qid], function (err) {
            if(err) this.logger.error(err);
            callback();
        });
    }
    
    clearDatabase(callback) {
        this.db.run(`
            DELETE FROM "data";
        `, function (err) {
            if(err) this.logger.error(err);
            callback(this.changes);
        });
    }
    
    output_database() {
        var padBy = 18;
        this.logger.log(`┌${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┐`);
        this.logger.log(`│${"id".padEnd(padBy)}│${"prefix".padEnd(padBy)}│${"servername".padEnd(padBy)}│${"lang".padEnd(padBy)}│${"categoryNames".padEnd(padBy)}│${"talkNameRules".padEnd(padBy)}│`);
        this.logger.log(`├${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┤`);
        this.db.each(`
            SELECT *
            FROM "data"
        `, (err, row) => {
            if (err) this.logger.error(err);
            this.logger.log(`│${row.id.padEnd(padBy)}│${row.prefix.padEnd(padBy)}│${row.servername.padEnd(padBy)}│${row.lang.padEnd(padBy)}│${row.categoryName.padEnd(padBy)}│${row.talkNameRules.padEnd(padBy).slice(0, padBy)}│`);
        }, (err, count) => {
            if (err) this.logger.error(err);
            this.logger.log(`├${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┘`);
            this.logger.log(`└ Rows: ${count}`);
        });
    }

}



module.exports = Database;