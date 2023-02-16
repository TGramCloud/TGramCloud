//Required dependencies
let EngineDependencies = {
  TelegramBot: require("node-telegram-bot-api"),
  sql: require("better-sqlite3"),
  fs: require("fs-extra"),
};

//Variables used by the engine
let EngineVariables = {
  DefaultLang: "en",
  Token: process.env.TOKEN || process.argv[2],
  OwnerID: process.env.OWNERID || process.argv[3],
  Instance: {},
};

//Functions used by the engine
let EngineFunctions = {
  //Init instance to allow easy access to the engine
  InitInstance: function (DBName) {
    instance = {
      bot: new EngineDependencies.TelegramBot(EngineVariables.Token, {
        polling: true,
        onlyFirstMatch: true,
      }),
      db: this.InitDB(DBName),
      pm2: process.env.PM2_HOME !== undefined,
      child: require("child_process"),
      owner: EngineVariables.OwnerID,
    };
    EngineVariables.Instance = instance;
  },

  InitDB: function (DBName) {
    //If a database file path has subfolders, create them
    if (DBName.includes("/")) {
      let DBPath = DBName.split("/");
      DBPath.pop();
      EngineDependencies.fs.mkdirSync(DBPath.join("/"), {
        recursive: true,
      });
    }
    //Create the database file
    return new EngineDependencies.sql(DBName);
  },

  //Create a settings table with stock settings
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

  //Add a new setting to the settings table
  AddSetting: function (option, value) {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "INSERT OR REPLACE INTO settings (option, value) VALUES (?, ?)"
    ).run(option, value);
  },

  //Get a setting from the settings table
  GetSetting: function (option) {
    let db = EngineVariables.Instance.db;
    return db.prepare("SELECT value FROM settings WHERE option = ?").get(option)
      .value;
  },

  //Set a new value of a setting
  SetSetting: function (option, value) {
    let db = EngineVariables.Instance.db;
    db.prepare("UPDATE settings SET value = ? WHERE option = ?").run(
      value,
      option
    );
  },

  //Delete the setting
  RemoveSetting: function (option) {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM settings WHERE option = ?").run(option);
  },

  //Reset settings to defaults
  ResetSettings: function () {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM settings").run();
  },

  //Check if a bot is run for the first time or if the settings are reset
  CheckFirstRun: function () {
    let db = EngineVariables.Instance.db;
    switch (this.GetSetting("first_run")) {
      case "true":
        return true;
      case "false":
        return false;
      default:
        return false;
    }
  },

  //Create a users table with stock parameters
  //You can override the default parameters by adding your own function in the custom file
  CreateUsersTable: function () {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "CREATE TABLE IF NOT EXISTS users (id TEXT UNIQUE, status TEXT, lang TEXT)"
    ).run();
  },

  //Wipe all users
  WipeUsersTable: function () {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM users").run();
  },

  //Add a new user to the users table
  //You can override the default parameters by adding your own function in the custom file
  AddUser: function (id, status, lang) {
    let db = EngineVariables.Instance.db;
    db.prepare(
      "INSERT OR IGNORE INTO users (id, status, lang) VALUES (?, ?, ?)"
    ).run(id, status, lang);
  },

  //Get a user from the users table
  GetUser: function (id) {
    let db = EngineVariables.Instance.db;
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  },

  //Delete a user from the users table
  DeleteUser: function (id) {
    let db = EngineVariables.Instance.db;
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
  },

  //Edit a user's data
  //You can override the default parameters by adding your own function in the custom file
  EditUser: function (id, status, lang) {
    let db = EngineVariables.Instance.db;
    db.prepare("UPDATE users SET status = ?, lang = ? WHERE id = ?").run(
      status,
      lang,
      id
    );
  },

  //Set the current version of the bot
  SetCurrentVersion: function () {
    EngineVariables.Instance.child.exec(
      "git fetch -q && git ls-remote --heads --quiet",
      (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        } else {
          this.SetSetting("current_version", stdout.toString().substring(0, 7));
        }
      }
    );
  },

  //Get the current version of the bot
  GetCurrentVersion: function () {
    return this.GetSetting("current_version");
  },

  //Bot updater routine
  UpdateBot: function (msg) {
    EngineVariables.Instance.child.exec(
      "git fetch -q && git ls-remote --heads --quiet",
      (err, stdout, stderr) => {
        if (err) {
          EngineVariables.Instance.bot.sendMessage(
            msg.chat.id,
            "Error while fetching updates."
          );
        } else {
          console.log(stdout);
          if (
            stdout.toString().substring(0, 7) !=
            this.GetSetting("current_version")
          ) {
            EngineVariables.Instance.bot.sendMessage(
              msg.chat.id,
              "Are you sure you want to update? (y/n)",
              {
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
              }
            );
            EngineVariables.Instance.bot.once("callback_query", (callback) => {
              switch (callback.data) {
                case "yes":
                  //Update the bot
                  EngineVariables.Instance.bot.sendMessage(
                    msg.chat.id,
                    "Downloading update..."
                  );
                  //Execute the update script
                  EngineVariables.Instance.child.exec(
                    "./update.sh",
                    function (err, stdout, stderr) {
                      if (err) {
                        console.log(err);
                        EngineVariables.Instance.bot.sendMessage(
                          msg.chat.id,
                          "Error while installing updates."
                        );
                      } else {
                        console.log(stdout);
                        child.exec("chmod 777 ./update.sh");
                        EngineFunctions.RestartInstance();
                        EngineVariables.Instance.bot.sendMessage(
                          msg.chat.id,
                          "Finished updating."
                        );
                        EngineFunctions.SetCurrentVersion();
                      }
                    }
                  );
                  break;
                case "no":
                  EngineVariables.Instance.bot.sendMessage(
                    msg.chat.id,
                    "Cancelled."
                  );
                  break;
              }
            });
          } else {
            EngineVariables.Instance.bot.sendMessage(
              msg.chat.id,
              "No updates found!"
            );
          }
        }
      }
    );
  },

  //Restart the bot
  RestartInstance: function () {
    if (EngineVariables.Instance.pm2) {
      const pm2 = require("pm2");
      pm2.restart("./index.js");
    }
  },

  CancelCommand: function(msg) {
    EngineVariables.Instance.bot.sendMessage(
      msg.chat.id,
      "Cancelled!"
    );
  }
};

module.exports = {
  EngineDependencies,
  EngineFunctions,
  EngineVariables,
};
