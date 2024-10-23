import { ButtonInteraction, EmbedBuilder } from 'discord.js';

interface AttendanceStatus {
  startTime: Date;
  isStarted: boolean;
}
const attendanceStatus: Map<string, AttendanceStatus> = new Map();

async function handleButton(interaction: ButtonInteraction) {
  try {
    if (!interaction.guild) {
      await interaction.reply({ content: '이 명령어는 서버에서만 사용할 수 있습니다.', ephemeral: true });
      return;
    }

    const userId = interaction.user.id;
    const member = interaction.member;
    const username = (member && 'nickname' in member && member.nickname) ? member.nickname : interaction.user.username;
    const currentTime = new Date();
    const guild = interaction.guild;
    const logAttendanceId = process.env.logAttendanceId || '';
    const logChannel = guild.channels.cache.get(logAttendanceId);

    if (!logChannel || !logChannel.isTextBased()) {
      await interaction.reply({ content: '로그 채널을 찾을 수 없습니다. 관리자에게 문의하세요.', ephemeral: true });
      return;
    }

    if (interaction.customId === 'start_attendance') {
      const status = attendanceStatus.get(userId);
      if (status && status.isStarted) {
        await interaction.reply({ content: '이미 출석이 시작되었습니다!', ephemeral: true });
        return;
      }

      attendanceStatus.set(userId, { startTime: currentTime, isStarted: true });
      await interaction.reply({ content: '✨ 출석 시작 시간을 기록했습니다!', ephemeral: true });

    } else if (interaction.customId === 'end_attendance') {
      const status = attendanceStatus.get(userId);
      if (!status || !status.isStarted) {
        await interaction.reply({ content: '출석 시작을 먼저 해야 합니다!', ephemeral: true });
        return;
      }

      // 출석 종료 시간 기록
      const startTime = status.startTime;
      const endTime = currentTime;
      const durationInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const hours = Math.floor(durationInSeconds / 3600);
      const minutes = Math.floor((durationInSeconds % 3600) / 60);
      const seconds = durationInSeconds % 60;
      const durationFormatted = `${hours}시간 ${minutes}분 ${seconds}초`;
      const attendanceThumbnail = 'https://cdn.pixabay.com/photo/2021/01/05/22/01/paw-5892565_1280.png';

      // 출석 상태 초기화
      attendanceStatus.delete(userId);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ 출석 기록')
        .setAuthor({ name: username, iconURL: interaction.user.displayAvatarURL() })
        .addFields(
          { name: '📅 시작 시간', value: startTime.toLocaleString(), inline: true },
          { name: '⏰ 종료 시간', value: endTime.toLocaleString(), inline: true },
          { name: '⏳ 총 근무 시간', value: durationFormatted, inline: false }
        )
        .setThumbnail(attendanceThumbnail)
        .setTimestamp();

      await interaction.reply({ content: '✅ 출석 종료 시간을 기록했습니다!', ephemeral: true });

      try {
        await logChannel.send({ embeds: [embed] });
      } catch (error) {
        console.error('메시지 전송 오류:', error);
      }
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '버튼 처리 중 오류가 발생했습니다.', ephemeral: true });
    }
  }
}

export default {
  handleButton,
};