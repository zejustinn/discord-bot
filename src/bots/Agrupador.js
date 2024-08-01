import path from 'node:path'
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js'
import { readJsFilesFromFolder } from '../classes/utils.js'
import {
  GROUP_CATEGORY_ID,
  GROUP_WAITING_VOICE_CHANNEL_ID,
} from '../classes/constants.js'

export default class Agrupador {
  static secret = process.env.DISCORD_BOTS_AGRUPADOR_SECRET
  static cliendId = process.env.DISCORD_BOTS_AGRUPADOR_CLIENT_ID
  static commandsFileName = ['grupo']

  groupId = { value: 0 }
  groups = []
  constructor(commands) {
    this.client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    })
    this.commands = commands
    this.setBotReadyEventListener()
    this.setBotInteractionCreateEventListener()
    this.setBotVoiceStateUpdateListener()
  }

  // Static async factory functions to handle the dinamic import of the commands
  static async createBot() {
    const commands = new Collection()

    for (const file of readJsFilesFromFolder('commands')) {
      if (Agrupador.commandsFileName.includes(file.replace('.js', ''))) {
        const filePath = path.join(`${import.meta.dirname}/../commands`, file)
        const { default: command } = await import(filePath)
        if ('data' in command && 'execute' in command) {
          commands.set(command.data.name, command)
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          )
        }
      }
    }

    return new Agrupador(commands)
  }

  setBotReadyEventListener() {
    this.client.once(Events.ClientReady, (client) => {
      console.log(`Bot ${client.user.displayName} está on!`)
    })
  }

  setBotInteractionCreateEventListener() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return
      const command = this.commands.get(interaction.commandName)

      try {
        await command.execute(interaction, this.groupId, this.groups)
      } catch (error) {
        console.error(error)
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content:
              'Ocorreu um erro ao executar o comando, fale com um moderador',
            ephemeral: true,
          })
        } else {
          await interaction.reply({
            content:
              'Ocorreu um erro ao executar o comando, fale com um moderador',
            ephemeral: true,
          })
        }
      }
    })
  }

  setBotVoiceStateUpdateListener() {
    this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      try {
        const user = await newState.guild.members.fetch(newState.id)
        if (oldState.channelId) {
          const group = this.groups.find(
            (group) => group.leaderId == oldState.id
          )

          if (
            group &&
            oldState.channelId == group.channelId &&
            newState.channelId !== oldState.channelId
          ) {
            group.activeMembers.delete(user.id)
            const newLeader = group.activeMembers.entries()?.next()?.value
            if (newLeader) {
              group.leaderId = newLeader[0]
              group.leaderName = newLeader[1]
            } else {
              this.groups.splice(this.groups.indexOf(group), 1)
              const oldChannel = await oldState.guild.channels.fetch(
                oldState.channelId
              )

              if (oldChannel) await oldChannel.delete()
            }
          }
        }

        if (newState.channelId) {
          const newChannel = await newState.guild.channels.fetch(
            newState.channelId
          )

          if (newChannel && newChannel.parentId === GROUP_CATEGORY_ID) {
            if (newChannel.id === GROUP_WAITING_VOICE_CHANNEL_ID) {
              if (!user.voice.mute) {
                return await user.voice.setMute(true)
              }
            } else {
              const group = this.groups.find(
                (group) => group.channelId == newChannel.id
              )

              if (group && !group.activeMembers.has(user.id)) {
                const waitingChannel = await newState.guild.channels.fetch(
                  GROUP_WAITING_VOICE_CHANNEL_ID
                )

                return await user.voice.setChannel(waitingChannel)
              }

              if (user.voice.mute) {
                return await user.voice.setMute(false)
              }
            }
          } else if (user.voice.mute) {
            return await user.voice.setMute(false)
          }
        }
      } catch (error) {
        console.error(error)
      }
    })
  }

  start() {
    this.client.login(Agrupador.secret)
  }
}
