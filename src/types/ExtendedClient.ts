import { Client, Collection, CommandInteraction } from 'discord.js';

export interface Command {
  data: {
    name: string;
  };
  execute: (interaction: CommandInteraction) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Collection<string, Command>;
}