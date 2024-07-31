import 'dotenv/config'
import path from 'node:path'
import { readJsFilesFromFolder, isBotProperlyDefined } from './classes/utils.js'
import { REST, Routes } from 'discord.js'

const botsClass = []
for (const file of readJsFilesFromFolder('bots')) {
  try {
    const filePath = path.join(`${import.meta.dirname}/bots`, file)
    const { default: Bot } = await import(filePath)
    if (isBotProperlyDefined(Bot)) {
      botsClass.push(Bot)
    } else {
      console.error(
        `Não foi possível atualizar os comandos do bot "${file.replace('.js', '').toLocaleUpperCase()}" pois estava faltando uma das seguinte propriedades: secret, cliendId ou commandsFileName`
      )
    }
  } catch (error) {
    console.error(error)
  }
}

await botsClass.forEach(async (botClass) => {
  const commands = []
  for (const file of readJsFilesFromFolder('commands')) {
    const filePath = path.join(`${import.meta.dirname}/commands`, file)
    if (botClass.commandsFileName.includes(file.replace('.js', ''))) {
      const { default: command } = await import(filePath)
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON())
      } else {
        console.warn(
          `[Atenção] O arquivo do comando "/${file.replace('.js', '')}" não possuí uma das seguintes propriedades obrigatórias: "data" ou "execute".`
        )
      }
    }
  }

  const rest = new REST().setToken(botClass.secret)
  ;(async () => {
    try {
      await rest.put(Routes.applicationCommands(botClass.cliendId), {
        body: commands,
      })
    } catch (error) {
      console.error(
        `Não foi possível atualizar os comandos do bot ${botClass.name}`
      )
    }
  })()
})
