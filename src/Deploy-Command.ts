// deploy.ts
import { REST, Routes, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../config.env') });

interface Command {
  data: {
    toJSON: () => RESTPostAPIApplicationCommandsJSONBody;
  };
  execute: (...args: any[]) => any;
}

async function main() {
  const commands: RESTPostAPIApplicationCommandsJSONBody[] = [];

  // 명령어 폴더 경로 설정
  const foldersPath = path.join(__dirname, 'commands');

  // 명령어 폴더들 읽기
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    // 각 폴더 내 명령어 파일 경로 설정
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        // 동적으로 명령어 모듈 가져오기
        const commandModule: { default: Command } = await import(filePath);
        const command: Command = commandModule.default;

        // 'data'와 'execute' 속성 확인
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
        } else {
          console.warn(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
        }
      } catch (error) {
        console.error(`[ERROR] Failed to load command at ${filePath}:`, error);
      }
    }
  }

  // 환경 변수에서 필요한 값 추출
  const token = process.env.token;
  const clientId = process.env.clientId;
  const guildId = process.env.guildId;

  // 필수 환경 변수 확인
  if (!token || !clientId || !guildId) {
    console.error('Missing required environment variables. Please check your config.env file.');
    process.exit(1);
  }

  // REST 인스턴스 생성 및 토큰 설정
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = (await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    )) as RESTPostAPIApplicationCommandsJSONBody[];

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
}

main();