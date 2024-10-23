import { Client, Collection, Events, GatewayIntentBits, Interaction, CommandInteraction } from 'discord.js';
import { initializeCommands, handleInteraction } from './interactions/Interactions';
import { ExtendedClient } from './types/ExtendedClient';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../config.env') });

const client: ExtendedClient = new Client({ intents: [GatewayIntentBits.Guilds] }) as ExtendedClient;
client.commands = new Collection();

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);

  await initializeCommands(client.commands);
  console.log('All commands have been loaded.');
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  await handleInteraction(interaction, client);
});

const token: string = process.env.token || '';
client.login(token);