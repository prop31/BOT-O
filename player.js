const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("เล่นเพลงจาก YouTube")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("ชื่อเพลงหรือ URL")
                .setRequired(true)
        ),

    async run(client, interaction) {
        try {
            const query = interaction.options.getString("query");
            const voiceChannel = interaction.member?.voice?.channel;
            
            if (!voiceChannel) {
                return interaction.reply({ 
                    content: "❌ คุณต้องอยู่ใน Voice Channel ก่อน!", 
                    ephemeral: true 
                });
            }

            await interaction.deferReply();

            const player = client.manager.create({
                guild: interaction.guild.id,
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channel.id,
                selfDeafen: true,
            });

            if (!player.connected) player.connect();

            const res = await client.manager.search(query, interaction.user);

            if (res.loadType === "error" || res.loadType === "empty") {
                if (!player.queue.current) player.destroy();
                return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
            }

            if (res.loadType === "playlist") {
                player.queue.add(res.tracks);
                
                const embed = new EmbedBuilder()
                    .setColor("#9b59b6")
                    .setTitle("📋 เพิ่ม Playlist")
                    .setDescription(`**${res.playlist.name}**`)
                    .addFields(
                        { name: "📊 จำนวนเพลง", value: `${res.tracks.length} เพลง`, inline: true },
                        { name: "👤 ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();

                if (!player.playing && !player.paused) player.play();
                return interaction.editReply({ embeds: [embed] });
            } else {
                const track = res.tracks[0];
                player.queue.add(track);

                const embed = new EmbedBuilder()
                    .setColor(player.playing ? "#3498db" : "#2ecc71")
                    .setTitle(player.playing ? "➕ เพิ่มเพลงลงคิว" : "🎵 กำลังเล่น")
                    .setDescription(`**[${track.title}](${track.uri})**`)
                    .addFields(
                        { name: "⏱️ ระยะเวลา", value: formatTime(track.duration), inline: true },
                        { name: "👤 ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setThumbnail(track.thumbnail || null)
                    .setTimestamp();

                if (!player.playing && !player.paused) player.play();
                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Play error:", error);
            return interaction.editReply("❌ เกิดข้อผิดพลาด");
        }
    }
};

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
