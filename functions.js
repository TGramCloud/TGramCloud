const { EngineDependencies, EngineFunctions, EngineVariables } = require("./engine.js");

let CustomVariables = {};

let CustomFunctions = {
  AuthAccount: function (msg) {
    EngineVariables.Instance.bot.sendMessage(
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
    EngineVariables.Instance.bot.once("message", (message) => {
      EngineFunctions.SetSetting("first_run", "false");
      EngineFunctions.SetSetting("cloud_token", message.text);
      EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Successfully authorized!");
    });
  },

  Logout: function (msg) {
    EngineFunctions.SetSetting("first_run", "true");
    EngineFunctions.SetSetting("cloud_token", "");
    EngineVariables.Instance.bot.sendMessage(msg.chat.id, "Successfully logged out!");
  }
};

module.exports = {
  CustomVariables,
  CustomFunctions,
};
