import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, CommandInteraction } from 'discord.js';
export default {
  data: new SlashCommandBuilder()
    .setName('attendance')
    .setDescription('출석 체크를 시작합니다.'),
  
  async execute(interaction: CommandInteraction) {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('start_attendance')
          .setLabel('✨ 시작 ✨')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('end_attendance')
          .setLabel('🚫 종료 🚫')
          .setStyle(ButtonStyle.Danger)
      );

    const embed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle('📅 출석 체크')
      .setDescription('아래 버튼을 클릭하여 출석을 시작하거나 종료하세요.')
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });
  },
};