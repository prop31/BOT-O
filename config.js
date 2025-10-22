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
  
  // แก้ไขส่วนนี้ - ใช้ Lavalink Server สาธารณะ
  nodes: [
    {
      name: "Main Node",
      password: "https://dsc.gg/ajidevserver",
      host: "lava-v3.ajieblogs.eu.org",
      port: 443,
      secure: true
    }
  ]
};
