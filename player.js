async run(client, interaction) {
    try {
        const query = interaction.options.getString("query");
        
        // ตรวจสอบว่าผู้ใช้อยู่ใน voice channel
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const voiceChannel = member.voice.channel;
        
        if (!voiceChannel) {
            return interaction.reply("❌ คุณต้องอยู่ใน Voice Channel ก่อน!");
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

        // **แก้ไขตรงนี้ - เพิ่มการจัดการข้อผิดพลาด**
        let resolve;
        try {
            resolve = await client.riffy.resolve({ 
                query: query,
                requester: interaction.user.id 
            });
        } catch (error) {
            console.error("Resolve error:", error);
            return interaction.editReply("❌ ไม่สามารถค้นหาเพลงได้ กรุณาลองใหม่อีกครั้ง");
        }

        // ตรวจสอบผลลัพธ์
        if (!resolve || !resolve.tracks || resolve.tracks.length === 0) {
            return interaction.editReply("❌ ไม่พบเพลงที่คุณค้นหา");
        }

        // ตรวจสอบ loadType
        if (resolve.loadType === "error") {
            return interaction.editReply("❌ เกิดข้อผิดพลาดในการโหลดเพลง");
        }

        if (resolve.loadType === "empty") {
            return interaction.editReply("❌ ไม่พบผลลัพธ์");
        }

        // เพิ่มเพลงลงคิว
        if (resolve.loadType === "playlist") {
            for (const track of resolve.tracks) {
                track.info.requester = interaction.user.id;
                player.queue.push(track);
            }

            if (!player.playing && !player.paused) {
                player.play();
            }

            return interaction.editReply(`✅ เพิ่ม **${resolve.tracks.length}** เพลงจาก Playlist: **${resolve.playlistInfo.name}**`);
        } else {
            // เพลงเดี่ยว
            const track = resolve.tracks[0];
            track.info.requester = interaction.user.id;
            player.queue.push(track);

            if (!player.playing && !player.paused) {
                player.play();
            } else {
                return interaction.editReply(`✅ เพิ่มเพลง **${track.info.title}** ลงในคิว`);
            }
        }

    } catch (error) {
        console.error("Play command error:", error);
        
        if (interaction.deferred || interaction.replied) {
            return interaction.editReply("❌ เกิดข้อผิดพลาดในการเล่นเพลง");
        } else {
            return interaction.reply("❌ เกิดข้อผิดพลาดในการเล่นเพลง");
        }
    }
}
