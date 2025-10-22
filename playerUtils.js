// playerUtils.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// เก็บข้อมูลผู้ request เพลง
const requesters = new Map();

// เก็บ message ของแต่ละ guild
const guildTrackMessages = new Map();

// ฟังก์ชันส่งข้อความโดยตรวจสอบ permission
async function sendMessageWithPermissionsCheck(channel, embed, attachment, actionRow1, actionRow2) {
    try {
        const message = await channel.send({
            embeds: [embed],
            files: [attachment],
            components: [actionRow1, actionRow2]
        });
        return message;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

// สร้าง Action Row 1 (แถวปุ่มแรก)
function createActionRow1(disabled = false) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('loop')
                .setEmoji('🔁')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('disable_loop')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('skip')
                .setEmoji('⏭️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('lyrics')
                .setEmoji('🎤')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('clear')
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled)
        );
}

// สร้าง Action Row 2 (แถวปุ่มที่สอง)
function createActionRow2(disabled = false) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('stop')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('pause')
                .setEmoji('⏸️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('resume')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Success)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('volume_up')
                .setEmoji('🔊')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId('volume_down')
                .setEmoji('🔉')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled)
        );
}

// ฟังก์ชันแปลงเวลา (มิลลิวินาที) เป็นรูปแบบ MM:SS หรือ HH:MM:SS
function formatDuration(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = {
    requesters,
    guildTrackMessages,
    sendMessageWithPermissionsCheck,
    createActionRow1,
    createActionRow2,
    formatDuration
};
