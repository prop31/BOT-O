const { Riffy } = require("riffy");
const { EmbedBuilder } = require("discord.js");

function initializePlayer(client) {
    client.riffy = new Riffy(client, [
        {
            host: "lava.link",
            port: 80,
            password: "anything",
            secure: false,
        }
    ], {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytsearch",
        restVersion: "v3", // เปลี่ยนเป็น v3
        resume: false,
        reconnectTries: 3,
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
        } else {
            player.destroy();
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
            setTimeout(() => player.destroy(), 3000);
        }
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
                .setThumbnail(track.info.thumbnail || null)
                .setTimestamp();
            
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
    if (!ms || ms === 0) return "🔴 LIVE";
    
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = { initializePlayer };
