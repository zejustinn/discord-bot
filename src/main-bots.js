import 'dotenv/config'
import path from 'node:path'
import { readJsFilesFromFolder, isBotProperlyDefined } from './classes/utils.js'

for (const file of readJsFilesFromFolder('bots')) {
  try {
    const filePath = path.join(`${import.meta.dirname}/bots`, file)
    const { default: Bot } = await import(filePath)
    if (isBotProperlyDefined(Bot)) {
      ;(await Bot.createBot(Bot)).start()
    } else {
      console.error(
        `Não foi possível iniciar o bot "${file.replace('.js', '').toLocaleUpperCase()}" pois estava faltando uma das seguinte propriedades: secret, cliendId ou comandsFileName`
      )
    }
  } catch (error) {
    console.error(error)
  }
}
