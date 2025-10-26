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
            
            // ตรวจสอบ voice channel
            const voiceChannel = interaction.member?.voice?.channel;
            
            if (!voiceChannel) {
                return interaction.reply({ 
                    content: "❌ คุณต้องอยู่ใน Voice Channel ก่อน!", 
                    ephemeral: true 
                });
            }

            // ตรวจสอบสิทธิ์
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has("Connect") || !permissions.has("Speak")) {
                return interaction.reply({
                    content: "❌ บอทไม่มีสิทธิ์เข้าร่วมหรือพูดใน Voice Channel นี้!",
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            // สร้างหรือดึง player
            let player = client.riffy.players.get(interaction.guild.id);
            
            if (!player) {
                player = client.riffy.create({
                    guild: interaction.guild.id,
                    voiceChannel: voiceChannel.id,
                    textChannel: interaction.channel.id,
                    volume: 50,
                    selfDeafen: true,
                });
            }

            // เชื่อมต่อ player
            if (!player.connected) {
                player.connect();
            }

            // ค้นหาเพลง
            let resolve;
            
            try {
                resolve = await client.riffy.resolve({ 
                    query: query,
                    requester: interaction.user.id 
                });

            } catch (resolveError) {
                console.error("Resolve error:", resolveError);
                
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                
                return interaction.editReply({
                    content: "❌ ไม่สามารถค้นหาเพลงได้\n" +
                             "**สาเหตุที่เป็นไปได้:**\n" +
                             "• Lavalink node ไม่พร้อมใช้งาน\n" +
                             "• URL ไม่ถูกต้อง\n" +
                             "• บริการค้นหามีปัญหา"
                });
            }

            // ตรวจสอบผลลัพธ์
            if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
            }

            const { loadType, tracks, playlistInfo } = resolve;

            // ตรวจสอบ loadType
            if (loadType === "error" || loadType === "empty") {
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
            }

            // เพิ่ม Playlist
            if (loadType === "playlist") {
                for (const track of tracks) {
                    track.info.requester = interaction.user.id;
                    player.queue.push(track);
                }

                if (!player.playing && !player.paused) {
                    player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor("#9b59b6")
                    .setTitle("📋 เพิ่ม Playlist")
                    .setDescription(`**${playlistInfo?.name || 'Playlist'}**`)
                    .addFields(
                        { name: "📊 จำนวนเพลง", value: `${tracks.length} เพลง`, inline: true },
                        { name: "👤 ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setFooter({ text: `คิวทั้งหมด: ${player.queue.length} เพลง` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } 
            // เพิ่มเพลงเดี่ยว
            else {
                const track = tracks[0];
                track.info.requester = interaction.user.id;
                player.queue.push(track);

                const isPlaying = player.playing || player.paused;
                
                const embed = new EmbedBuilder()
                    .setColor(isPlaying ? "#3498db" : "#2ecc71")
                    .setTitle(isPlaying ? "➕ เพิ่มเพลงลงคิว" : "🎵 กำลังเล่น")
                    .setDescription(`**[${track.info.title}](${track.info.uri})**`)
                    .addFields(
                        { name: "⏱️ ระยะเวลา", value: formatTime(track.info.length), inline: true },
                        { name: "👤 ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setThumbnail(track.info.thumbnail || null)
                    .setTimestamp();

                if (isPlaying) {
                    embed.addFields({ 
                        name: "📍 ตำแหน่งในคิว", 
                        value: `#${player.queue.length}`, 
                        inline: true 
                    });
                    embed.setFooter({ text: `คิวทั้งหมด: ${player.queue.length} เพลง` });
                }

                if (!isPlaying) {
                    player.play();
                }

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error("Play command error:", error);
            console.error("Error stack:", error.stack);
            
            const errorMessage = `❌ เกิดข้อผิดพลาด: ${error.message}`;
            
            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ content: errorMessage }).catch(console.error);
            } else {
                return interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
            }
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
