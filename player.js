const { Riffy } = require("riffy");
const { EmbedBuilder } = require("discord.js");

function initializePlayer(client) {
    client.riffy = new Riffy(client, [
        {
            host: "lavalinkv3-id.serenetia.com",
            port: 443,
            password: "BatuManaBisa",
            secure: true,
        }
    ], {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: "ytmsearch",
        restVersion: "v4",
        // เพิ่มตรงนี้เพื่อแก้ปัญหาค้าง
        resume: true,
        resumeKey: "riffy-resume",
        resumeTimeout: 60,
        reconnectTries: 5,
        reconnectInterval: 5000,
    });

    // เพิ่ม Error Handlers
    client.riffy.on("nodeConnect", node => {
        console.log(`✅ Node "${node.name}" connected.`);
    });

    client.riffy.on("nodeError", (node, error) => {
        console.log(`❌ Node "${node.name}" error: ${error.message}`);
    });

    client.riffy.on("nodeReconnect", node => {
        console.log(`🔄 Node "${node.name}" reconnecting...`);
    });

    // แก้ปัญหาค้าง - เพิ่ม Track Error Handler
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

    // แก้ปัญหาค้าง - Track Stuck Handler
    client.riffy.on("trackStuck", (player, track, threshold) => {
        console.log(`⚠️ Track stuck: ${track.info.title}`);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            channel.send("⚠️ เพลงค้าง กำลังข้ามไปเพลงถัดไป...");
        }
        player.stop();
    });

    // Track End - เล่นเพลงต่อไป
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

    // เล่นเพลงเริ่มต้น
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
}

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

module.exports = { initializePlayer };


