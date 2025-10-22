module.exports = {
  TOKEN: "",
  language: "en",
  ownerID: ["1094503668386123857", ""], 
  mongodbUri : "mongodb+srv://Thaboh:yourarm@bot.ufpvdav.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId : "",
  spotifyClientSecret : "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#FF7A00",
  activityName: "YouTube Music", 
  activityType: "LISTENING",
  SupportServer: "https://discord.gg/9wtkFbF5C5",
  embedTimeout: 15,
  errorLog: "",
  
   nodes: [
        {
            name: "main",
            host: "pnode1.danbot.host",
            port: 1351,
            password: "cocaine",
            secure: false
        }
    ]
};

