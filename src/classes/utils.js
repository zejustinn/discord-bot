import fs from 'node:fs'
import path from 'node:path'
import { setTimeout } from 'node:timers/promises'

export const readJsFilesFromFolder = (folderName) => {
  const botsPath = path.join(`${import.meta.dirname}/..`, folderName)
  return fs.readdirSync(botsPath).filter((file) => file.endsWith('.js'))
}

export const isBotProperlyDefined = (Bot) => {
  return 'secret' in Bot && 'cliendId' in Bot && 'commandsFileName' in Bot
}

export const replyCommandInStandardWay = async (
  interaction,
  content,
  timeToDeleteMessage = 15000
) => {
  await interaction.editReply({
    content,
    ephemeral: true,
  })
  await setTimeout(timeToDeleteMessage)
  await interaction.deleteReply()
}
