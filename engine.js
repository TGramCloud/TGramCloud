let EngineVariables = {
  DefaultLang: "en",
  Token: process.env.TOKEN || process.argv[2],
  OwnerID: process.env.OWNERID || process.argv[3]
};

let EngineFunctions = {
  InitInstance: function (bot, db) {
    instance = {
      bot: bot,
      db: db,
    };
    return instance;
  },

  CreateSettingsTable: function (db) {
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

  AddSetting: function (db, option, value) {
    db.prepare(
      "INSERT OR REPLACE INTO settings (option, value) VALUES (?, ?)"
    ).run(option, value);
  },

  GetSetting: function (db, option) {
    return db
      .prepare("SELECT value FROM settings WHERE option = ?")
      .get(option).value;
  },

  SetSetting: function (db, option, value) {
    db.prepare("UPDATE settings SET value = ? WHERE option = ?").run(
      value,
      option
    );
  },

  RemoveSetting: function (db, option) {
    db.prepare("DELETE FROM settings WHERE option = ?").run(option);
  },

  ResetSettings: function (db) {
    db.prepare("DELETE FROM settings").run();
  },

  CheckFirstRun: function (db) {
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

  CreateUsersTable: function (db) {
    db.prepare(
      "CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE, status TEXT, lang TEXT)"
    ).run();
  },

  WipeUsersTable: function (db) {
    db.prepare("DELETE FROM users").run();
  },

  AddUser: function (db, id, status, lang) {
    db.prepare(
      "INSERT OR IGNORE INTO users (id, status, lang) VALUES (?, ?, ?)"
    ).run(id, status, lang);
  },

  GetUser: function (db, id) {
    return db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(id);
  },

  DeleteUser: function (db, id) {
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  },

  EditUser: function (db, id, status, lang) {
    db.prepare(
      "UPDATE users SET status = ?, lang = ? WHERE id = ?"
    ).run(status, lang, id);
  },

  
  SetCurrentVersion: function (child) {
    child.exec("git fetch -q && git ls-remote --heads --quiet", (err, stdout, stderr) => {
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

  UpdateBot: function (child, bot_instance, msg) {
    child.exec("git fetch -q && git ls-remote --heads --quiet", (err, stdout, stderr) => {
      if (err) {
        bot_instance.bot.sendMessage(msg.chat.id, "Error while fetching updates.");
      } else {
        console.log(stdout);
        if (stdout.toString().substring(0, 7) != this.GetSetting("current_version")) {
          bot_instance.bot.sendMessage(msg.chat.id, "Are you sure you want to update? (y/n)", {
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
          bot_instance.bot.once("callback_query", (callback) => {
            switch (callback.data) {
              case "yes":
                //Update the bot
                bot_instance.bot.sendMessage(msg.chat.id, "Downloading update...");
                //Execute the update script
                child.exec(
                  "./update.sh",
                  function(err, stdout, stderr) {
                    if (err) {
                      console.log(err);
                      bot_instance.bot.sendMessage(msg.chat.id, "Error while installing updates.");
                    } else {
                      console.log(stdout);
                      child.exec("chmod 777 ./update.sh");
                      bot_instance.bot.sendMessage(msg.chat.id, "Finished updating.");
                      pm2.restart("./app.js");
                      EngineFunctions.SetCurrentVersion(child);
                    }
                  }
                );
                break;
              case "no":
                bot_instance.bot.sendMessage(msg.chat.id, "Cancelled.");
                break;
            }
          });
        }
        else {
          bot_instance.bot.sendMessage(msg.chat.id, "No updates found!");
        }
      }
    }
    );
  }
}

module.exports = {
  EngineFunctions,
  EngineVariables,
};
