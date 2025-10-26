const { Client, GatewayIntentBits } = require("discord.js");
const { Riffy } = require("riffy");
const { EmbedBuilder } = require("discord.js");
const config = require("./config.js");
const fs = require("fs");
const path = require('path');
const { connectToDatabase } = require('./mongodb');
const colors = require('./UI/colors/colors');
require('dotenv').config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits).map((a) => {
        return GatewayIntentBits[a];
    }),
});

client.config = config;

// ย้ายโค้ด initializePlayer มาไว้ที่นี่เลย
client.riffy = new Riffy(client, [
    {
        host: "pnode1.danbot.host",
        port: 1351,
        password: "cocaine",
        secure: false,
    }
], {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytsearch",
    restVersion: "v3",
    resume: false,
    reconnectTries: 3,
    reconnectInterval: 5000,
});

client.riffy.on("nodeConnect", node => {
    console.log(`${colors.cyan}[ NODE ]${colors.reset} ${colors.green}Connected to ${node.name} ✅${colors.reset}`);
});

client.riffy.on("nodeError", (node, error) => {
    console.log(`${colors.cyan}[ NODE ]${colors.reset} ${colors.red}Error: ${error.message} ❌${colors.reset}`);
});

client.riffy.on("trackStart", async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor("#2ecc71")
            .setTitle("🎵 กำลังเล่น")
            .setDescription(`**[${track.info.title}](${track.info.uri})**`)
            .addFields(
                { name: "⏱️ ระยะเวลา", value: formatTime(track.info.length), inline: true },
                { name: "👤 ผู้ขอเพลง", value: `<@${track.info.requester}>`, inline: true }
            )
            .setThumbnail(track.info.thumbnail || null);
        channel.send({ embeds: [embed] });
    }
});

client.riffy.on("trackEnd", async (player) => {
    if (player.queue.length > 0) {
        player.play();
    } else {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) channel.send("✅ เล่นเพลงในคิวหมดแล้ว");
        setTimeout(() => player.destroy(), 3000);
    }
});

client.riffy.on("trackError", (player, track, error) => {
    console.log(`❌ Track error: ${error}`);
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) channel.send("⚠️ เกิดข้อผิดพลาด");
});

function formatTime(ms) {
    if (!ms || ms === 0) return "🔴 LIVE";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

client.once("ready", () => {
    console.log(`${colors.cyan}[ SYSTEM ]${colors.reset} ${colors.green}Client logged as ${colors.yellow}${client.user.tag}${colors.reset}`);
    console.log(`${colors.cyan}[ MUSIC ]${colors.reset} ${colors.green}Riffy Music System Ready 🎵${colors.reset}`);
    client.riffy.init(client.user.id);
});

// โหลด Events
fs.readdir("./events", (err, files) => {
    if (err) return;
    files.forEach((file) => {
        if (!file.endsWith(".js")) return;
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0]; 
        client.on(eventName, event.bind(null, client));
    });
});

// โหลด Commands
client.commands = [];
fs.readdir(config.commandsDir, (err, files) => {
    if (err) return;
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
            console.log(err);
        }
    });
});

client.on("raw", (d) => {
    const { GatewayDispatchEvents } = require("discord.js");
    if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(d.t)) return;
    client.riffy.updateVoiceState(d);
});

connectToDatabase()
    .then(() => console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.green}MongoDB Online ✅${colors.reset}`))
    .catch((err) => console.log(`${colors.cyan}[ DATABASE ]${colors.reset} ${colors.red}Failed ❌${colors.reset}`));

client.login(config.TOKEN || process.env.TOKEN);

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(port, () => console.log(`${colors.cyan}[ SERVER ]${colors.reset} ${colors.green}Online on :${port} ✅${colors.reset}`));
