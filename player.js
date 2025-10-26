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
            const member = interaction.guild.members.cache.get(interaction.user.id);
            const voiceChannel = member?.voice?.channel;
            
            if (!voiceChannel) {
                return interaction.reply({ 
                    content: "❌ คุณต้องอยู่ใน Voice Channel ก่อน!", 
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

            // เชื่อมต่อ player ถ้ายังไม่ได้เชื่อม
            if (!player.connected) {
                player.connect();
            }

            // **แก้ไขส่วนนี้ - เพิ่ม try-catch และตรวจสอบข้อมูล**
            let resolve;
            
            try {
                resolve = await client.riffy.resolve({ 
                    query: query,
                    requester: interaction.user.id 
                });

                console.log("Resolve result:", JSON.stringify(resolve, null, 2)); // Debug log

            } catch (resolveError) {
                console.error("Resolve error details:", resolveError);
                
                // ลบ player ถ้าเกิด error
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                
                return interaction.editReply({
                    content: "❌ ไม่สามารถค้นหาเพลงได้ อาจเป็นเพราะ:\n" +
                             "• Lavalink node ไม่พร้อมใช้งาน\n" +
                             "• URL หรือคำค้นหาไม่ถูกต้อง\n" +
                             "• บริการค้นหาเพลงมีปัญหา"
                });
            }

            // ตรวจสอบว่า resolve มีข้อมูลหรือไม่
            if (!resolve) {
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                return interaction.editReply("❌ ไม่สามารถค้นหาเพลงได้");
            }

            // ตรวจสอบ loadType
            const { loadType, tracks, playlistInfo } = resolve;

            if (loadType === "error" || loadType === "empty") {
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
            }

            // ตรวจสอบว่ามี tracks หรือไม่
            if (!tracks || tracks.length === 0) {
                if (player && player.queue.length === 0) {
                    player.destroy();
                }
                return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
            }

            // จัดการ Playlist
            if (loadType === "playlist") {
                for (const track of tracks) {
                    track.info.requester = interaction.user.id;
                    player.queue.push(track);
                }

                if (!player.playing && !player.paused) {
                    player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setTitle("✅ เพิ่ม Playlist")
                    .setDescription(`**${playlistInfo?.name || 'Playlist'}**`)
                    .addFields(
                        { name: "จำนวนเพลง", value: `${tracks.length} เพลง`, inline: true },
                        { name: "ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            } 
            // จัดการเพลงเดี่ยว
            else {
                const track = tracks[0];
                track.info.requester = interaction.user.id;
                player.queue.push(track);

                const embed = new EmbedBuilder()
                    .setColor("#00FF00")
                    .setTitle("✅ เพิ่มเพลงลงคิว")
                    .setDescription(`**[${track.info.title}](${track.info.uri})**`)
                    .addFields(
                        { name: "ระยะเวลา", value: formatTime(track.info.length), inline: true },
                        { name: "ผู้ขอเพลง", value: `<@${interaction.user.id}>`, inline: true },
                        { name: "ตำแหน่งในคิว", value: `#${player.queue.length}`, inline: true }
                    )
                    .setThumbnail(track.info.thumbnail)
                    .setTimestamp();

                if (!player.playing && !player.paused) {
                    player.play();
                    embed.setTitle("🎵 กำลังเล่น");
                }

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error("Play command error:", error);
            console.error("Error stack:", error.stack);
            
            const errorMessage = "❌ เกิดข้อผิดพลาดในการเล่นเพลง\n" +
                               `ข้อความ: ${error.message}`;
            
            if (interaction.deferred) {
                return interaction.editReply({ content: errorMessage });
            } else if (!interaction.replied) {
                return interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
};

function formatTime(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}
