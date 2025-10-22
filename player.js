// player.js
const { Riffy } = require('riffy');
const { EmbedBuilder } = require('discord.js');
const config = require('./config.js');

function initializePlayer(client) {
    // สร้าง Riffy instance
    const nodes = [
        {
            host: config.LAVALINK_HOST || 'localhost',
            port: config.LAVALINK_PORT || 2333,
            password: config.LAVALINK_PASSWORD || 'youshallnotpass',
            secure: config.LAVALINK_SECURE || false,
            name: 'Main Node'
        }
    ];

    client.riffy = new Riffy(client, nodes, {
        send: (payload) => {
            const guild = client.guilds.cache.get(payload.d.guild_id);
            if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: 'ytmsearch',
        restVersion: 'v4'
    });

    // Event: Track Start
    client.riffy.on('trackStart', async (player, track) => {
        console.log(`Now playing: ${track.info.title} in guild ${player.guildId}`);
    });

    // Event: Track End
    client.riffy.on('trackEnd', async (player, track) => {
        console.log(`Finished: ${track.info.title}`);
    });

    // Event: Queue End
    client.riffy.on('queueEnd', async (player) => {
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription('✅ Queue has ended. No more songs to play.');
            
            await channel.send({ embeds: [embed] });
        }
        player.destroy();
    });

    // Event: Player Create
    client.riffy.on('playerCreate', (player) => {
        console.log(`Player created for guild ${player.guildId}`);
    });

    // Event: Player Destroy
    client.riffy.on('playerDestroy', (player) => {
        console.log(`Player destroyed for guild ${player.guildId}`);
    });

    // Event: Node Connect
    client.riffy.on('nodeConnect', (node) => {
        console.log(`Node "${node.name}" connected`);
    });

    // Event: Node Disconnect
    client.riffy.on('nodeDisconnect', (node) => {
        console.log(`Node "${node.name}" disconnected`);
    });

    // Event: Node Error
    client.riffy.on('nodeError', (node, error) => {
        console.error(`Node "${node.name}" error:`, error);
    });

    // Event: Track Error
    client.riffy.on('trackError', (player, track, error) => {
        console.error(`Error playing ${track.info.title}:`, error);
        const channel = client.channels.cache.get(player.textChannel);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`❌ Error playing: **${track.info.title}**`);
            channel.send({ embeds: [embed] });
        }
    });

    console.log('✅ Riffy player initialized successfully');
}

module.exports = { initializePlayer };
