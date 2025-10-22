

module.exports = {
  TOKEN: "",
  language: "en",
  ownerID: ["1094503668386123857", ""], 
  mongodbUri : "mongodb+srv://Thaboh:yourarm@bot.ufpvdav.mongodb.net/?retryWrites=true&w=majority",
  spotifyClientId : "",
  spotifyClientSecret : "",
  setupFilePath: './commands/setup.json',
  commandsDir: './commands',  
  embedColor: "#1db954",
  activityName: "YouTube Music", 
  activityType: "LISTENING",  // Available activity types : LISTENING , PLAYING
  SupportServer: "https://discord.gg/xQF9f9yUEM",
  embedTimeout: 5, 
  errorLog: "", 
  nodes: [
     {
      name: "GlaceYT",
      password: "glace",
      host: "87.106.62.92",
      port:  11642,
      secure: false
    }
  ]
}
