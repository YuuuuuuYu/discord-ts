import { Interaction, Collection } from 'discord.js';
import attendanceHandler from './AttendanceHandler';
import { ExtendedClient, Command } from '../types/ExtendedClient';
import fs from 'fs';
import path from 'path';

export async function initializeCommands(commands: Collection<string, Command>) {
  const commandsPath = path.join(__dirname, '../commands');

  const commandFolders = fs.readdirSync(commandsPath).filter(folder => {
    const folderPath = path.join(commandsPath, folder);
    return fs.statSync(folderPath).isDirectory();
  });

  const loadCommandsPromises: Promise<void>[] = [];

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);

      const loadCommand = import(filePath)
        .then((commandModule: { default: Command }) => {
          const command = commandModule.default;
          if ('data' in command && 'execute' in command) {
            commands.set(command.data.name, command);
            console.log(`Loaded command: ${command.data.name}`);
          } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
          }
        })
        .catch(error => {
          console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
        });

      loadCommandsPromises.push(loadCommand);
    }
  }

  // 모든 명령어 로딩 프로미스를 병렬로 실행
  await Promise.all(loadCommandsPromises);
}

export async function handleInteraction(interaction: Interaction, client: ExtendedClient) {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[ERROR] Error executing command ${interaction.commandName}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
      } else {
        await interaction.reply({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
      }
    }
  } else if (interaction.isButton()) {
    try {
      await attendanceHandler.handleButton(interaction);
    } catch (error) {
      console.error('[ERROR] Error handling button interaction:', error);
      await interaction.reply({ content: '버튼 처리 중 오류가 발생했습니다.', ephemeral: true });
    }
  }
}