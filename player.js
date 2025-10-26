const { Kazagumo, KazagumoPlayer } = require("kazagumo");
const { Connectors } = require("kazagumo");
const { EmbedBuilder } = require("discord.js");

function initializePlayer(client) {
    client.kazagumo = new Kazagumo({
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
            const guild = client.guilds.cache.get(guildId);
            if (guild) guild.shard.send(payload);
        }
    }, new Connectors.DiscordJS(client), [
        {
            name: "main",
            url: "lava.link:80",
            auth: "anything",
            secure: false
        }
    ]);

    client.kazagumo.on("playerStart", (player, track) => {
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor("#2ecc71")
                .setTitle("🎵 กำลังเล่น")
                .setDescription(`**[${track.title}](${track.uri})**`)
                .addFields(
                    { name: "⏱️ ระยะเวลา", value: formatTime(track.length), inline: true },
                    { name: "👤 ผู้ขอเพลง", value: `<@${track.requester}>`, inline: true }
                )
                .setThumbnail(track.thumbnail || null);
            channel.send({ embeds: [embed] });
        }
    });

    client.kazagumo.on("playerEnd", (player) => {
        if (player.queue.size === 0) {
            const channel = client.channels.cache.get(player.textId);
            if (channel) channel.send("✅ เล่นเพลงในคิวหมดแล้ว");
            setTimeout(() => player.destroy(), 3000);
        }
    });

    client.kazagumo.on("playerError", (player, error) => {
        console.error("Player error:", error);
        const channel = client.channels.cache.get(player.textId);
        if (channel) channel.send("❌ เกิดข้อผิดพลาดในการเล่นเพลง");
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
