let EngineFunctions = {

  InitInstance:  function(bot, db) {
    instance = {
      bot: bot,
      db: db,
    };
    return instance;
  },

  CreateSettingsTable: function(db) {
    db.prepare(
      "CREATE TABLE IF NOT EXISTS settings (option TEXT UNIQUE, value TEXT)"
    ).run();
    db.prepare(
        "INSERT OR IGNORE INTO settings (option, value) VALUES ('first_run', 'true')"
    ).run();
  },
  
  AddSetting: function(db, option, value) {
    db.prepare(
      "INSERT OR REPLACE INTO settings (option, value) VALUES (?, ?)"
    ).run(option, value);
  },
  
  GetSetting: function(db, option) {
    return db.prepare("SELECT value FROM settings WHERE option = ?").get(option);
  },

  SetSetting: function(db, option, value) {
    db.prepare("UPDATE settings SET value = ? WHERE option = ?").run(value, option);
  },
  
  RemoveSetting: function(db, option) {
    db.prepare("DELETE FROM settings WHERE option = ?").run(option);
  },
  
  CheckFirstRun: function(db) {
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
  }

}



module.exports = EngineFunctions;