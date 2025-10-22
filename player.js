const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { requesters } = require('./play'); // map เก็บ requester

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

        // Defer reply เพื่อกัน interaction timeout
        await interaction.deferReply();

        if (!client.riffy || client.riffy.nodes.size === 0) {
            // ไม่มี node พร้อม
            return interaction.editReply({ 
                content: '❌ **No Lavalink nodes are available. Please try again later.**', 
                ephemeral: true 
            });
        }

        try {
            const player = client.riffy.createPlayer(interaction.guildId, {
                voiceChannel: interaction.member.voice.channelId,
                textChannel: interaction.channelId,
            });

            // Search และ play track
            const track = await client.riffy.search(query, interaction.user.id, { searchPlatform: 'ytmsearch' });
            if (!track || !track[0]) {
                return interaction.editReply({ content: '❌ **No results found for your query.**', ephemeral: true });
            }

            player.play(track[0]);
            requesters.set(track[0].info.uri, `<@${interaction.user.id}>`);

            return interaction.editReply({ 
                content: `🎶 Now playing: **${track[0].info.title}** by **${track[0].info.author || 'Unknown'}**`
            });
        } catch (error) {
            console.error('Play command error:', error);
            if (!interaction.replied) {
                return interaction.editReply({ 
                    content: '❌ **Failed to play the track.**', 
                    ephemeral: true 
                });
            }
        }
    }
};
