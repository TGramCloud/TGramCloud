let EngineDependencies = {
  TelegramBot: require("node-telegram-bot-api"),
  sql: require("better-sqlite3")
}

let EngineVariables = {
  DefaultLang: "en",
  Token: process.env.TOKEN || process.argv[2],
  OwnerID: process.env.OWNERID || process.argv[3],
  Instance: {}
};

let EngineFunctions = {
  InitInstance: function (DBName) {
    instance = {
      bot: new EngineDependencies.TelegramBot(EngineVariables.Token, {
        polling: true,
        onlyFirstMatch: true,
      }),
      db: new EngineDependencies.sql(DBName),
      pm2: process.env.PM2_HOME !== undefined,
      child: require("child_process")
    };
    EngineVariables.Instance = instance;
  },

  CreateSettingsTable: function () {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "CREATE TABLE IF NOT EXISTS settings (option TEXT UNIQUE, value TEXT)"
    ).run();
    db.prepare(
      "INSERT OR IGNORE INTO settings (option, value) VALUES ('first_run', 'true')"
    ).run();
    db.prepare(
      "INSERT OR IGNORE INTO settings (option, value) VALUES ('current_version', '')"
    ).run();
  },

  AddSetting: function (option, value) {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "INSERT OR REPLACE INTO settings (option, value) VALUES (?, ?)"
    ).run(option, value);
  },

  GetSetting: function (option) {
    let db = EngineVariables.Instance.db;
    return db
      .prepare("SELECT value FROM settings WHERE option = ?")
      .get(option).value;
  },

  SetSetting: function (option, value) {
    let db = EngineVariables.Instance.db;
    db.prepare("UPDATE settings SET value = ? WHERE option = ?").run(
      value,
      option
    );
  },

  RemoveSetting: function (option) {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM settings WHERE option = ?").run(option);
  },

  ResetSettings: function () {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM settings").run();
  },

  CheckFirstRun: function () {
    let db = EngineVariables.Instance.db;
    switch (
      db.prepare("SELECT value FROM settings WHERE option = 'first_run'").get()
        .value
    ) {
      case "true":
        return true;
      case "false":
        return false;
      default:
        return false;
    }
  },

  CreateUsersTable: function () {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE, status TEXT, lang TEXT)"
    ).run();
  },

  WipeUsersTable: function () {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM users").run();
  },

  AddUser: function (id, status, lang) {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "INSERT OR IGNORE INTO users (id, status, lang) VALUES (?, ?, ?)"
    ).run(id, status, lang);
  },

  GetUser: function (id) {
    let db = EngineVariables.Instance.db;
    return db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id);
  },

  DeleteUser: function (id) {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  },

  EditUser: function (id, status, lang) {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "UPDATE users SET status = ?, lang = ? WHERE id = ?"
    ).run(status, lang, id);
  },

  
  SetCurrentVersion: function () {
    EngineVariables.Instance.child.exec("git fetch -q && git ls-remote --heads --quiet", (err, stdout, stderr) => {
      if (err) {
        console.log(err);
      } else {
        this.SetSetting("current_version", stdout.toString().substring(0, 7));
      }
    })
  },

  GetCurrentVersion: function () {
    return this.GetSetting("current_version");
  },

  UpdateBot: function (msg) {
    EngineVariables.Instance.child.exec("git fetch -q && git ls-remote --heads --quiet", (err, stdout, stderr) => {
      if (err) {
        EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Error while fetching updates.");
      } else {
        console.log(stdout);
        if (stdout.toString().substring(0, 7) != this.GetSetting("current_version")) {
          EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Are you sure you want to update? (y/n)", {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Yes",
                    callback_data: "yes",
                  },
                ],
                [
                  {
                    text: "No",
                    callback_data: "no",
                  },
                ],
              ],
            },
          });
          EngineVariables.Instance.bot.once("callback_query", (callback) => {
            switch (callback.data) {
              case "yes":
                //Update the bot
                EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Downloading update...");
                //Execute the update script
                EngineVariables.Instance.child.exec(
                  "./update.sh",
                  function(err, stdout, stderr) {
                    if (err) {
                      console.log(err);
                      EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Error while installing updates.");
                    } else {
                      console.log(stdout);
                      child.exec("chmod 777 ./update.sh");
                      EngineFunctions.RestartInstance();
                      EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Finished updating.");
                      EngineFunctions.SetCurrentVersion();
                    }
                  }
                );
                break;
              case "no":
                EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Cancelled.");
                break;
            }
          });
        }
        else {
          EngineVariables.Instance.bot.sendMessage(msg.chat.id, "No updates found!");
        }
      }
    }
    );
  },

  RestartInstance: function () {
    if (EngineVariables.Instance.pm2) {
      const pm2 = require("pm2");
      pm2.restart("./index.js")
    }
  }
}

module.exports = {
  EngineDependencies,
  EngineFunctions,
  EngineVariables,
};
