const { EngineFunctions, EngineVariables } = require("./engine.js");

let CustomVariables = {};

let CustomFunctions = {
  AuthAccount: function (bot_instance, msg) {
    bot_instance.bot.sendMessage(
      msg.chat.id,
      "Please follow the instructions on the attached web page to get started.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Authorize OneDrive",
                web_app: {
                  url: "https://alexavil.github.io/onedrive-telegram-web/auth.html",
                },
              },
            ],
          ],
        },
      }
    );
    bot_instance.bot.once("message", (message) => {
      EngineFunctions.SetSetting(bot_instance.db, "first_run", "false");
      EngineFunctions.SetSetting(bot_instance.db, "cloud_token", message.text);
      bot_instance.bot.sendMessage(msg.chat.id, "Successfully authorized!");
    });
  },

  Logout: function (bot_instance, msg) {
    EngineFunctions.SetSetting(bot_instance.db, "first_run", "true");
    EngineFunctions.SetSetting(bot_instance.db, "cloud_token", "");
    bot_instance.bot.sendMessage(msg.chat.id, "Successfully logged out!");
  }
};

module.exports = {
  CustomVariables,
  CustomFunctions,
};
