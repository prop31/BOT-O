const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { initializePlayer } = require('./player');
const { connectToDatabase } = require('./mongodb');
const colors = require('./UI/colors/colors');
require('dotenv').config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;

// เริ่มต้น Player ก่อน ready event
initializePlayer(client);

// ถ้าใช้ riffy ให้เปลี่ยนเป็น client.riffy
// ถ้าใช้ erela.js ให้เปลี่ยนเป็น client.manager
client.riffy.on("nodeConnect", node => {
    console.log(`${colors.cyan}[ NODE ]${colors.reset} ${colors.green}Connected to ${node.name} ✅${colors.reset}`);
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`${colors.cyan}[ NODE ]${colors.reset} ${colors.red}Error: ${error.message} ❌${colors.reset}`);
});

client.once("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}Riffy Music System Ready 🎵${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace('T', ' ').split('.')[0]}${colors.reset}`);
    
    // เริ่มต้น Riffy หลัง client ready
    client.riffy.init(client.user.id);
});

// โหลด Events
fs.readdir("./events", (err, files) => {
    if (err) {
        console.log(`${colors.red}[ ERROR ]${colors.reset} Cannot read events directory`);
        return;
    }
    
    files.forEach((file) => {
        if (!file.endsWith(".js")) return;
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0]; 
        client.on(eventName, event.bind(null, client));
        delete require.cache[require.resolve(`./events/${file}`)];
    });
});

// โหลด Commands
client.commands = [];
fs.readdir(config.commandsDir, (err, files) => {
    if (err) {
        console.log(`${colors.red}[ ERROR ]${colors.reset} Cannot read commands directory`);
        return;
    }
    
    files.forEach(async (f) => {
        try {
            if (f.endsWith(".js")) {
                let props = require(`${config.commandsDir}/${f}`);
                client.commands.push({
                    name: props.name,
                    description: props.description,
                    options: props.options,
                });
            }
        } catch (err) {
            console.log(`${colors.red}[ ERROR ]${colors.reset} Failed to load command: ${f}`);
            console.log(err);
        }
    });
});

// Voice State Handler
client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

// เชื่อมต่อ MongoDB ก่อน Login
connectToDatabase()
    .then(() => {
        console.log('\n' + '─'.repeat(40));
        console.log(`${colors.magenta}${colors.bright}🕸️  DATABASE STATUS${colors.reset}`);
        console.log('─'.repeat(40));
        console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}MongoDB Online ✅${colors.reset}`);
    })
    .catch((err) => {
        console.log('\n' + '─'.repeat(40));
        console.log(`${colors.magenta}${colors.bright}🕸️  DATABASE STATUS${colors.reset}`);
        console.log('─'.repeat(40));
        console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.red}Connection Failed ❌${colors.reset}`);
        console.log(`${colors.gray}Error: ${err.message}${colors.reset}`);
    });

// Login Bot
client.login(config.TOKEN || process.env.TOKEN).catch((e) => {
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}🔐 TOKEN VERIFICATION${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.cyan}[ TOKEN ]${colors.reset} ${colors.red}Authentication Failed ❌${colors.reset}`);
    console.log(`${colors.gray}Error: Turn On Intents or Reset New Token${colors.reset}`);
    console.log(`${colors.gray}Details: ${e.message}${colors.reset}`);
    process.exit(1);
});

// Express Server
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const imagePath = path.join(__dirname, 'index.html');
    res.sendFile(imagePath);
});

app.listen(port, () => {
    console.log('\n' + '─'.repeat(40));
    console.log(`${colors.magenta}${colors.bright}🌐 SERVER STATUS${colors.reset}`);
    console.log('─'.repeat(40));
    console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online ✅${colors.reset}`);
    console.log(`${colors.cyan}[ PORT ]${colors.reset} ${colors.yellow}http://localhost:${port}${colors.reset}`);
    console.log(`${colors.cyan}[ TIME ]${colors.reset} ${colors.gray}${new Date().toISOString().replace('T', ' ').split('.')[0]}${colors.reset}`);
});

// Error Handlers
process.on('unhandledRejection', (error) => {
    console.log(`${colors.red}[ UNHANDLED REJECTION ]${colors.reset}`, error);
});

process.on('uncaughtException', (error) => {
    console.log(`${colors.red}[ UNCAUGHT EXCEPTION ]${colors.reset}`, error);
});
