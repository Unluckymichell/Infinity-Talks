// Imports
const sqlite3 = require('sqlite3').verbose();
var db = null;

function init(cconsole, db_path, callback) {
    console = cconsole;
    db = new sqlite3.Database(db_path, err => {
        if (err) console.error(err);
        db.run(`
        CREATE TABLE IF NOT EXISTS "data" (
            "id"	        TEXT NOT NULL,
            "prefix"	    TEXT NOT NULL,
            "servername"    TEXT NOT NULL,
            "lang"	        TEXT NOT NULL,
            "categoryName"	BLOB NOT NULL,
            "talkNameRules"	BLOB NOT NULL,
            PRIMARY KEY("id")
        );`, function (err) {
            if (err) console.error(err);
            callback();
        });
    });
}

function getGuildSettings(qid, defaultGs, guildName, callback) {
    db.get(`
        SELECT *
        FROM "data"
        WHERE id = ?;
    `, [qid], function (err, gs) {
        if(err) console.error(err);
        if(gs) callback(gs);
        else {
            db.run(`
                INSERT INTO "data"
                VALUES (?, ?, ?, ?, ?, ?);
            `, [qid, defaultGs.prefix, guildName, defaultGs.lang, defaultGs.categoryName, defaultGs.talkNameRules], function (err) {
                if(err) console.error(err);
                callback(defaultGs);
            });
        }
    });
}

function changeGuildSettings(qid, key, value, callback) {
    db.run(`
        UPDATE "data"
        SET ${key} = ?
        WHERE id = ?;
    `, [value, qid], function (err) {
        if(err) console.error(err);
        callback();
    });
}

function clearDatabase(callback) {
    db.run(`
        DELETE FROM "data";
    `, function (err) {
        if(err) console.error(err);
        callback(this.changes);
    });
}

function output_database() {
    var padBy = 18;
    console.log(`┌${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┬${"─".repeat(padBy)}┐`);
    console.log(`│${"id".padEnd(padBy)}│${"prefix".padEnd(padBy)}│${"servername".padEnd(padBy)}│${"lang".padEnd(padBy)}│${"categoryNames".padEnd(padBy)}│${"talkNameRules".padEnd(padBy)}│`);
    console.log(`├${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┼${"─".repeat(padBy)}┤`);
    db.each(`
        SELECT *
        FROM "data"
    `, function (err, row) {
        if (err) console.error(err);
        console.log(`│${row.id.padEnd(padBy)}│${row.prefix.padEnd(padBy)}│${row.servername.padEnd(padBy)}│${row.lang.padEnd(padBy)}│${row.categoryName.padEnd(padBy)}│${row.talkNameRules.padEnd(padBy).slice(0, padBy)}│`);
    }, function (err, count) {
        if (err) console.error(err);
        console.log(`├${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┴${"─".repeat(padBy)}┘`);
        console.log(`└ Rows: ${count}`);
    });
}

module.exports = {
    init,
    getGuildSettings,
    changeGuildSettings,
    clearDatabase,
    output_database
}