const engine = require("./engine.js");

let CustomFunctions = {
    AuthAccount: function(bot_instance, msg) {
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
          engine.SetSetting(bot_instance.db, "first_run", "false");
          engine.SetSetting(bot_instance.db, "token", message.text);
          bot_instance.bot.sendMessage(msg.chat.id, "Successfully authorized!");
        });
      }
}

module.exports = CustomFunctions;