import { ChannelType, SlashCommandBuilder } from 'discord.js'
import Group from '../classes/Group.js'
import {
  GROUP_CATEGORY_ID,
  GROUP_CONSOLE_TEXT_CHANNEL_ID,
  GROUP_WAITING_VOICE_CHANNEL_ID,
} from '../classes/constants.js'
import { replyCommandInStandardWay } from '../classes/utils.js'

export default {
  data: new SlashCommandBuilder()
    .setName('grupo')
    .setDescription('Comandos para gerenciamento de grupo')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('criar')
        .setDescription('Cria um grupo')
        .addStringOption((option) =>
          option
            .setName('nome')
            .setDescription('Nome do grupo')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('quantidade-de-jogadores')
            .setDescription('A quantidade de membros permitidos no grupo')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('usuarios-id')
            .setDescription(
              "Identificador do usuário ou usuários(ID do usuário). Os IDs devem ser passados separados por ','"
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('listar')
        .setDescription('Lista os grupos ativos')
        .addStringOption((option) =>
          option
            .setName('grupo-id')
            .setDescription('Identificador(ID) do grupo = ID do grupo')
        )
        .addStringOption((option) =>
          option
            .setName('canal-id')
            .setDescription('Identificador(ID) do grupo = ID do canal')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('atualizar')
        .setDescription('Atualiza os dados do grupo')
        .addUserOption((option) =>
          option
            .setName('lider-id')
            .setDescription(
              'Identificador(ID) do novo lider(usuário) = ID do usuário'
            )
        )
        .addStringOption((option) =>
          option.setName('nome').setDescription('Nome do grupo')
        )
        .addIntegerOption((option) =>
          option
            .setName('quantidade-de-jogadores')
            .setDescription('A quantidade de membro permitido no grupo')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('ingressar')
        .setDescription('Entra no grupo de ID informado')
        .addStringOption((option) =>
          option
            .setName('canal-id')
            .setDescription('Identificador(ID) do grupo = ID do canal')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remover')
        .setDescription('Remove o membro do grupo')
        .addStringOption((option) =>
          option
            .setName('usuario-id')
            .setDescription(
              'Identificador(ID) do usuário(membro) = ID do usuário'
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('banir')
        .setDescription('Bane o membro do grupo')
        .addStringOption((option) =>
          option
            .setName('usuario-id')
            .setDescription(
              'Identificador(ID) do usuário(membro) = ID do usuário'
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reservar')
        .setDescription(
          'Reserva um lugar ou alguns lugeres no grupo para membros específicos'
        )
        .addStringOption((option) =>
          option
            .setName('usuarios-id')
            .setDescription(
              "Identificador do usuário ou usuários(ID do usuário). Os IDs devem ser passados separados por ','"
            )
            .setRequired(true)
        )
    ),
  async execute(interaction, groupId, groups) {
    await interaction.deferReply({
      ephemeral: true,
    })

    if (true) {
      switch (interaction.options._subcommand) {
        case 'criar':
          return await runCreateCommand(interaction, groupId, groups)

        case 'listar':
          return await runListCommand(interaction, groups)

        case 'atualizar':
          return await runUpdateCommand(interaction, groups)

        case 'ingressar':
          return await runJoinCommand(interaction, groups)

        case 'remover':
          return await runKickCommand(interaction, groups)

        case 'banir':
          return await runBanCommand(interaction, groups)

        case 'reservar':
          return await runReserveCommand(interaction, groups)
      }
    }

    return await replyCommandInStandardWay(
      interaction,
      `Os comando de barra relacionado a gerenciamento de grupos funcionam apenas no canal <#${GROUP_CONSOLE_TEXT_CHANNEL_ID}>  😁`,
      30000
    )
  },
}

const runCreateCommand = async (interaction, groupId, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      `Você só pode criar um grupo se estiver conectado a um canal de voz  😖 utilize o canal <#${GROUP_WAITING_VOICE_CHANNEL_ID}>`
    )

  groupId.value = groupId.value === 99999 ? 1 : groupId.value + 1

  const name = interaction.options._hoistedOptions.find(
    (option) => option.name === 'nome'
  ).value
  const memberQuantityAllowed = interaction.options._hoistedOptions.find(
    (option) => option.name === 'quantidade-de-jogadores'
  )?.value

  const group = new Group(
    groupId.value,
    name,
    'Not created yet',
    interaction.user.id,
    interaction.member.user.globalName,
    memberQuantityAllowed
  )

  const channel = await interaction.guild.channels.create({
    parent: GROUP_CATEGORY_ID,
    name: `${groupId.value}-${name}`,
    type: ChannelType.GuildVoice,
  })

  group.channelId = channel.id
  groups.push(group)

  const usersId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'usuarios-id'
  )?.value
  if (usersId) {
    if (usersId.indexOf(',') > 0) {
      const ids = usersId.split(',')
      ids.forEach(async (id) => {
        const fixedId = id.replace(' ', '')
        if (fixedId !== interaction.user.id) {
          try {
            const user = await interaction.guild.members.fetch(fixedId)

            group.reservedPlaces.set(fixedId, user.user.globalName)
          } catch {}
        }
      })
    } else {
      if (usersId !== interaction.user.id) {
        try {
          const user = await interaction.guild.members.fetch(usersId)

          group.reservedPlaces.set(usersId, user.user.globalName)
        } catch {}
      }
    }
  }

  await interaction.member.voice.setChannel(channel)

  return await replyCommandInStandardWay(
    interaction,
    '## Grupo criado com sucesso!  🎉🎉🎉 \n' + group
  )
}

const runListCommand = async (interaction, groups) => {
  if (groups.length === 0)
    return await replyCommandInStandardWay(
      interaction,
      'Não há grupos criados no momento 😕  mas não desanima não, cria o teu aí  😉'
    )

  const groupId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'grupo-id'
  )?.value
  if (groupId) {
    const group = groups.find((group) => group.id == groupId)
    if (!group)
      return await replyCommandInStandardWay(
        interaction,
        'Grupo não encontrado!  🤔'
      )

    return await replyCommandInStandardWay(
      interaction,
      group.getGroupDetailMessage(),
      30000
    )
  }

  const channelId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'canal-id'
  )?.value
  if (channelId) {
    const group = groups.find((group) => group.channelId == channelId)
    if (!group)
      return await replyCommandInStandardWay(
        interaction,
        'Grupo não encontrado!  🤔'
      )

    return await replyCommandInStandardWay(
      interaction,
      group.getGroupDetailMessage(),
      30000
    )
  }

  return await replyCommandInStandardWay(
    interaction,
    '## Grupos: \n' + groups.join(''),
    60000
  )
}

const runUpdateCommand = async (interaction, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pode atualizar um grupo se não pertecer a um  🤯'
    )

  const group = groups.find(
    (group) => group.channelId === interaction.member.voice.channel.id
  )
  if (!group)
    return await replyCommandInStandardWay(
      interaction,
      'Grupo não encontrado!  🤔'
    )

  if (!group.isLeader(interaction.user.id))
    return await replyCommandInStandardWay(
      interaction,
      'Apenas o líder do grupo pode alterar as informações do grupo  🤥'
    )

  const newLeaderId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'lider-id'
  )?.value
  if (newLeaderId) {
    const newLeaderName = group.activeMembers.get(newLeaderId)
    if (!newLeaderName)
      return await replyCommandInStandardWay(
        interaction,
        'Você pode apenas nomear membros que pertencem a seu grupo   🤡'
      )

    group.leaderId = newLeaderId
    group.leaderName = newLeaderName
  }

  const name = interaction.options._hoistedOptions.find(
    (option) => option.name === 'nome'
  )?.value
  if (name) {
    await interaction.guild.channels.edit(interaction.member.voice.channel.id, {
      name: `${group.id}-${name}`,
    })

    group.name = name
  }

  const memberQuantityAllowed = interaction.options._hoistedOptions.find(
    (option) => option.name === 'quantidade-de-jogadores'
  )?.value
  if (memberQuantityAllowed) group.memberQuantityAllowed = memberQuantityAllowed

  if (!newLeaderId && !name && !memberQuantityAllowed) {
    return await replyCommandInStandardWay(
      interaction,
      'Nada foi atualizado  😖, certifique-se de que usou o comando corretamente  🤔'
    )
  }

  return await replyCommandInStandardWay(
    interaction,
    'Grupo atualizado com sucesso!  🎉🎉🎉'
  )
}

const runJoinCommand = async (interaction, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      `Para poder ingressar em um grupo é necessário que você esteja conectado a um canal de voz  😖 utilize o canal <#${GROUP_WAITING_VOICE_CHANNEL_ID}>`
    )

  const channelId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'canal-id'
  )?.value
  const group = groups.find((group) => group.channelId == channelId)
  if (!group)
    return await replyCommandInStandardWay(
      interaction,
      'Grupo não encontrado!  🤔'
    )

  if (group.isABannedMember(interaction.user.id))
    return await replyCommandInStandardWay(
      interaction,
      'Você não pode ingressar em um grupo que foi banido  🤡'
    )

  if (
    !group.reservedPlaces.has(interaction.user.id) &&
    group.activeMembers.size === group.memberQuantityAllowed
  )
    return await replyCommandInStandardWay(
      interaction,
      'O grupo já está cheio  😖'
    )

  if (group.reservedPlaces.has(interaction.user.id)) {
    const userName = group.reservedPlaces.get(interaction.user.id)
    group.reservedPlaces.delete(interaction.user.id)
    group.activeMembers.set(interaction.user.id, userName)
  } else
    group.activeMembers.set(
      interaction.user.id,
      interaction.member.user.globalName
    )

  const channel = await interaction.guild.channels.fetch(group.channelId)
  await interaction.member.voice.setChannel(channel)
  return await replyCommandInStandardWay(
    interaction,
    'Movido para o grupo com sucesso!  🎉🎉🎉 '
  )
}

const runKickCommand = async (interaction, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pode remover alguém de um grupo se não pertecer a um  🤯'
    )

  const group = groups.find(
    (group) => group.channelId === interaction.member.voice.channel.id
  )
  if (!group)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pertence a um grupo  🤡'
    )

  if (!group.isLeader(interaction.user.id))
    return await replyCommandInStandardWay(
      interaction,
      'Apenas o líder do grupo pode remover membros do grupo  🤥'
    )

  const userId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'usuario-id'
  )?.value
  if (!group.activeMembers.has(userId))
    return await replyCommandInStandardWay(
      interaction,
      'Este membro não pertence ao seu grupo!  🤔'
    )

  if (group.leaderId == userId)
    return await replyCommandInStandardWay(
      interaction,
      'Proibido remover esse(a) lindo(a)!  🤭'
    )

  group.activeMembers.delete(userId)
  const user = await interaction.guild.members.fetch(userId)
  const channel = await interaction.guild.channels.fetch(
    GROUP_WAITING_VOICE_CHANNEL_ID
  )
  user.voice.setChannel(channel)

  return await replyCommandInStandardWay(
    interaction,
    'Membro removido com sucesso!  🎉🎉🎉 \n' + group
  )
}

const runBanCommand = async (interaction, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pode remover alguém de um grupo se não pertecer a um  🤯'
    )

  const group = groups.find(
    (group) => group.channelId === interaction.member.voice.channel.id
  )
  if (!group)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pertence a um grupo  😖'
    )

  if (!group.isLeader(interaction.user.id))
    return await replyCommandInStandardWay(
      interaction,
      'Apenas o líder do grupo pode remover membros do grupo  🤥'
    )

  const userId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'usuario-id'
  )?.value
  if (!group.activeMembers.has(userId))
    return await replyCommandInStandardWay(
      interaction,
      'Este membro não pertence ao seu grupo!  🤔'
    )

  if (group.leaderId == userId)
    return await replyCommandInStandardWay(
      interaction,
      'Proibido banir esse(a) lindo(a)!  🤭'
    )

  const bannedMemberName = group.activeMembers.get(userId)
  group.bannedMembers.set(userId, bannedMemberName)
  group.activeMembers.delete(userId)

  const user = await interaction.guild.members.fetch(userId)
  const channel = await interaction.guild.channels.fetch(
    GROUP_WAITING_VOICE_CHANNEL_ID
  )
  user.voice.setChannel(channel)
  return await replyCommandInStandardWay(
    interaction,
    'Membro banido com sucesso!  🎉🎉🎉 \n' + group
  )
}

const runReserveCommand = async (interaction, groups) => {
  if (!interaction.member.voice.channel)
    return await replyCommandInStandardWay(
      interaction,
      'Você não pode reservar um lugar no grupo se não pertecer a um  🤯'
    )

  const group = groups.find(
    (group) => group.channelId === interaction.member.voice.channel.id
  )
  if (!group)
    return await replyCommandInStandardWay(
      interaction,
      'Grupo não encontrado!  🤔'
    )

  if (!group.isLeader(interaction.user.id))
    return await replyCommandInStandardWay(
      interaction,
      'Apenas o líder do grupo pode reservar lugares no grupo  🤥'
    )

  const usersId = interaction.options._hoistedOptions.find(
    (option) => option.name === 'usuarios-id'
  )?.value
  let errors = []
  const ids = usersId.split(',')
  ids.forEach(async (id) => {
    const fixedId = id.replace(' ', '')
    if (fixedId !== interaction.user.id) {
      try {
        const user = await interaction.guild.members.fetch(fixedId)

        group.reservedPlaces.set(fixedId, user.user.globalName)
      } catch {
        errors.push(fixedId)
      }
    }
  })

  if (ids.length === errors.length)
    return await replyCommandInStandardWay(
      interaction,
      `O usuário ${errors[0]} não foi localizado  🤔`
    )

  if (errors.length !== 0) {
    if (errors.length === 1) {
      return await replyCommandInStandardWay(
        interaction,
        `O usuário ${errors[0]} não foi localizado e por isso não teve seu lugar reservado  😖, mas os que foram localizados tiveram!  🎉🎉🎉`
      )
    } else {
      return await replyCommandInStandardWay(
        interaction,
        `Os usuários ${errors.join(',')} não foram localizados e por isso não tiveram seus lugares reservados  😖, mas os outros que foram localizados tiveram!  🎉🎉🎉`
      )
    }
  }

  return await replyCommandInStandardWay(
    interaction,
    'Lugares reservados com sucesso!  🎉🎉🎉'
  )
}
