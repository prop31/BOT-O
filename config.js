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
  
  // ลอง Lavalink Server อื่น
  nodes: [
    {
        name: "main",
        host: "lava-v3.ajieblogs.eu.org",
        port: 443,
        password: "https://dsc.gg/ajidevserver",
        secure: true
    }
  ]
}; // ⬅️ เพิ่มตรงนี้ (ปิด module.exports)
