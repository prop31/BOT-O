const { Riffy } = require("riffy");
const { EmbedBuilder } = require("discord.js");

function initializePlayer(client) {
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
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
        resume: true,
        resumeKey: "riffy-resume",
        resumeTimeout: 60,
        reconnectTries: 5,
        reconnectInterval: 5000,
    });

    // Node Events
    client.riffy.on("nodeConnect", node => {
        console.log(`✅ Node "${node.name}" connected.`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.log(`❌ Node "${node.name}" error: ${error.message}`);
    });

    client.riffy.on("nodeReconnect", node => {
        console.log(`🔄 Node "${node.name}" reconnecting...`);
    });

    // Track Events
    client.riffy.on("trackError", (player, track, error) => {
        console.log(`❌ Track error: ${error}`);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("⚠️ เกิดข้อผิดพลาดในการเล่นเพลง กำลังข้ามไปเพลงถัดไป...");
        }
        if (player.queue.length > 0) {
            player.stop();
        }
    });

    client.riffy.on("trackStuck", (player, track, threshold) => {
        console.log(`⚠️ Track stuck: ${track.info.title}`);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("⚠️ เพลงค้าง กำลังข้ามไปเพลงถัดไป...");
        }
        player.stop();
    });

    client.riffy.on("trackEnd", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (player.queue.length > 0) {
            player.play();
        } else {
            if (channel) {
                channel.send("✅ เล่นเพลงในคิวหมดแล้ว");
            }
            player.destroy();
        }
    });

    client.riffy.on("trackStart", async (player, track) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor("#2f3136")
                .setTitle("🎵 กำลังเล่น")
                .setDescription(`**[${track.info.title}](${track.info.uri})**`)
                .addFields(
                    { name: "ระยะเวลา", value: formatTime(track.info.length), inline: true },
                    { name: "ผู้ขอเพลง", value: `<@${track.info.requester}>`, inline: true }
                )
                .setThumbnail(track.info.thumbnail);
            channel.send({ embeds: [embed] });
        }
    });

    client.riffy.on("queueEnd", (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("✅ เล่นเพลงในคิวหมดแล้ว");
        }
        setTimeout(() => {
            if (player && !player.playing) {
                player.destroy();
            }
        }, 5000);
    });
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

module.exports = { initializePlayer };
