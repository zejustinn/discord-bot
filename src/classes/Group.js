export default class Group {
  bannedMembers = new Map()
  activeMembers = new Map()
  reservedPlaces = new Map()
  constructor(
    id,
    channelId,
    leaderId,
    leaderName,
    game,
    memberQuantityAllowed
  ) {
    this.id = id
    this.channelId = channelId
    this.leaderId = leaderId
    this.leaderName = leaderName
    this.game = game
    this.memberQuantityAllowed = memberQuantityAllowed
    this.activeMembers.set(leaderId, leaderName)
  }

  isLeader(memberId) {
    return this.leaderId === memberId
  }

  isABannedMember(memberId) {
    return this.bannedMembers.has(memberId)
  }

  updateGroupLeader(leaderId, leaderName) {
    this.leaderId = leaderId
    this.leaderName = leaderName
  }

  getCollectionDetailString(title, collection) {
    let collectionDetailString = `**${title}:** \n\`\`\``

    collection.forEach((value, key) => {
      collectionDetailString += `${value} | ID do usuário: ${key}\n`
    })

    collectionDetailString += '```'

    return collectionDetailString
  }

  getGroupDetailMessage() {
    let membersDetail = this.getCollectionDetailString(
      'Membros ativos',
      this.activeMembers
    )

    if (this.reservedPlaces.size != 0)
      membersDetail += this.getCollectionDetailString(
        'Lugares reservados para',
        this.reservedPlaces
      )

    if (this.bannedMembers.size != 0)
      membersDetail += this.getCollectionDetailString(
        'Membros banidos',
        this.bannedMembers
      )

    return `**ID do canal:** ${this.channelId}\n**Grupo:** ${this.id}-${this.game.toLocaleUpperCase()} \n**Quantidade jogadores:** ${this.activeMembers.size}/${this.memberQuantityAllowed}\n${membersDetail}`
  }

  toString() {
    return `\`\`\`ID do canal | ${this.channelId}\nID do grupo | ${this.id}\n   Líder    | ${this.leaderName}\n  Jogando   | ${this.game}\nMembros max | ${this.memberQuantityAllowed}\`\`\``
  }
}
