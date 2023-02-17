const {
  EngineDependencies,
  EngineFunctions,
  EngineVariables,
} = require("./engine.js");

let CustomVariables = {
  CloudProvider: {
    OneDrive: "onedrive",
    Yandex: "yandex",
  },
};

let CustomFunctions = {
  CreateTempDir: function() {
    if (!EngineDependencies.fs.pathExists("./temp")) {
      return EngineDependencies.fs.mkdir("./temp")
    } else return false;
  },

  AuthAccount: function (msg) {
    EngineVariables.Instance.bot.sendMessage(
      msg.chat.id,
      "Please select your Cloud Provider to get started.",
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "OneDrive",
                callback_data: "onedrive",
              },
            ],
            [
              {
                text: "Yandex",
                callback_data: "yandex",
              },
            ],
            [
              {
                text: "Cancel",
                callback_data: "cancel",
              },
            ],
          ],
        },
      }
    );
    EngineVariables.Instance.bot.once("callback_query", (callback) => {
      switch (callback.data) {
        case "onedrive": {
          EngineVariables.Instance.bot.sendMessage(
            msg.chat.id,
            "Please visit the web page to get started.",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Authorize a OneDrive Account",
                      web_app: {
                        url: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=c097ff5b-8892-4d71-8fe2-e3ad2682b394&scope=Files.ReadWrite.All&response_type=token&redirect_uri=https://tgramcloud.github.io/auth/success.html",
                      },
                    },
                  ],
                ],
              },
            }
          );
          EngineVariables.Instance.bot.once("message", (message) => {
            EngineFunctions.SetSetting("first_run", "false");
            EngineFunctions.SetSetting("cloud_provider", "onedrive");
            EngineFunctions.SetSetting("cloud_token", message.text);
            return EngineVariables.Instance.bot.sendMessage(
              msg.chat.id,
              "Successfully authorized!"
            );
          });
          break;
        }
        case "yandex": {
          EngineVariables.Instance.bot.sendMessage(
            msg.chat.id,
            "Please visit the web page to get started.",
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Authorize a Yandex Account",
                      web_app: {
                        url: "https://oauth.yandex.ru/authorize?response_type=token&client_id=0fa7c16bc1144d029d07dc91f0bfe8a1&redirect_uri=https://tgramcloud.github.io/auth/success.html",
                      },
                    },
                  ],
                ],
              },
            }
          );
          EngineVariables.Instance.bot.once("message", (message) => {
            EngineFunctions.SetSetting("first_run", "false");
            EngineFunctions.SetSetting("cloud_provider", "yandex");
            EngineFunctions.SetSetting("cloud_token", message.text);
            return EngineVariables.Instance.bot.sendMessage(
              msg.chat.id,
              "Successfully authorized!"
            );
          });
          break;
        }
        case "cancel": {
          return EngineFunctions.CancelCommand(msg);
        }
        default: {
          return false;
        }
      }
    });
  },

  Logout: function (msg) {
    let provider = EngineFunctions.GetSetting("cloud_provider");
    switch (provider) {
      case "onedrive":
      case "yandex": {
        EngineFunctions.SetSetting("first_run", "true");
        EngineFunctions.SetSetting("cloud_provider", "");
        EngineFunctions.SetSetting("cloud_token", "");
        EngineVariables.Instance.bot.sendMessage(
          msg.chat.id,
          "Your account has been deauthorized!"
        );
        break;
      }
      case "": {
        return EngineVariables.Instance.bot.sendMessage(
          msg.chat.id,
          "You are not logged in!"
        );
      }
      default: {
        return false;
      }
    }
  },
};

module.exports = {
  CustomVariables,
  CustomFunctions,
};
