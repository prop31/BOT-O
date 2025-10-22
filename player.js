const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Dynamic } = require('musicard');
const path = require('path');
const fs = require('fs');
const { requesters } = require('./play');
const { guildTrackMessages, sendMessageWithPermissionsCheck, createActionRow1, createActionRow2, formatDuration } = require('./playerUtils'); // ฟังก์ชันช่วยเหลือ
const musicIcons = require('./UI/icons/musicicons.js');
const config = require('./config.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube, Spotify, etc.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const query = interaction.options.getString('query');

        // Defer reply ก่อน กัน interaction timeout
        await interaction.deferReply();

        // ตรวจสอบ Node
        if (!client.riffy || client.riffy.nodes.size === 0) {
            return interaction.editReply({
                content: '❌ **No Lavalink nodes are available. Please try again later.**',
                ephemeral: true
            });
        }

        // ตรวจสอบ Voice Channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.editReply({
                content: '❌ **You need to be in a voice channel to play music.**',
                ephemeral: true
            });
        }

        try {
            // สร้าง Player
            const player = client.riffy.createPlayer(interaction.guildId, {
                voiceChannel: voiceChannel.id,
                textChannel: interaction.channelId,
            });

            // Search เพลง
            const trackResults = await client.riffy.search(query, interaction.user.id, { searchPlatform: 'ytmsearch' });
            if (!trackResults || trackResults.length === 0) {
                return interaction.editReply({ content: '❌ **No results found for your query.**', ephemeral: true });
            }

            const track = trackResults[0];
            requesters.set(track.info.uri, `<@${interaction.user.id}>`);

            // เล่นเพลง
            player.play(track);

            // สร้าง Musicard
            const musicard = await Dynamic({
                thumbnailImage: track.info.thumbnail || 'https://example.com/default_thumbnail.png',
                backgroundColor: '#070707',
                progress: 10,
                progressColor: '#FF7A00',
                progressBarColor: '#5F2D00',
                name: track.info.title,
                nameColor: '#FF7A00',
                author: track.info.author || 'Unknown Artist',
                authorColor: '#696969',
            });

            const cardPath = path.join(__dirname, `musicard-${Date.now()}.png`);
            fs.writeFileSync(cardPath, musicard);

            const attachment = new AttachmentBuilder(cardPath, { name: 'musicard.png' });
            const embed = new EmbedBuilder()
                .setAuthor({ name: 'Playing Song..', iconURL: musicIcons.playerIcon, url: config.SupportServer })
                .setFooter({ text: 'Developed by SSRR | Prime Music v1.2', iconURL: musicIcons.heartIcon })
                .setTimestamp()
                .setDescription(
                    `- **Title:** [${track.info.title}](${track.info.uri})\n` +
                    `- **Author:** ${track.info.author || 'Unknown Artist'}\n` +
                    `- **Length:** ${formatDuration(track.info.length)}\n` +
                    `- **Requester:** <@${interaction.user.id}>\n` +
                    `- **Source:** ${track.info.sourceName}\n` +
                    '**- Controls :**\n 🔁 Loop, ❌ Disable, ⏭️ Skip, 🎤 Lyrics, 🗑️ Clear\n ⏹️ Stop, ⏸️ Pause, ▶️ Resume, 🔊 Vol +, 🔉 Vol -'
                )
                .setImage('attachment://musicard.png')
                .setColor('#FF7A00');

            const actionRow1 = createActionRow1(false);
            const actionRow2 = createActionRow2(false);

            // ส่ง Embed + Musicard
            const message = await sendMessageWithPermissionsCheck(interaction.channel, embed, attachment, actionRow1, actionRow2);

            // เก็บ message เพื่อ cleanup
            if (message) {
                if (!guildTrackMessages.has(interaction.guildId)) guildTrackMessages.set(interaction.guildId, []);
                guildTrackMessages.get(interaction.guildId).push({
                    messageId: message.id,
                    channelId: interaction.channelId,
                    type: 'track'
                });
            }

            // ตอบ interaction ให้เรียบร้อย
            await interaction.editReply({ content: `🎶 Now playing: **${track.info.title}**` });

        } catch (error) {
            console.error('Play command error:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: '❌ **Failed to play the track.**', ephemeral: true });
            }
        }
    }
};
