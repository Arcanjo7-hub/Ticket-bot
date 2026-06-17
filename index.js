require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`${client.user.tag} online`);
});

client.on("interactionCreate", async interaction => {

  if (interaction.isStringSelectMenu()) {

    if (interaction.customId === "ticket_menu") {

      const tipo = interaction.values[0];

      const canal = await interaction.guild.channels.create({
        name: `${tipo}-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle("Central de Atendimento")
        .setDescription(
          `Olá ${interaction.user},

Nossa equipe responderá o mais rápido possível.

📌 Categoria: ${tipo}`
        )
        .setColor("#0099ff");

      canal.send({ embeds: [embed] });

      interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        ephemeral: true
      });
    }
  }
});

client.on("messageCreate", async message => {

  if (message.content === "!painel") {

    const embed = new EmbedBuilder()
      .setTitle("Central de Suporte")
      .setDescription(
        "Selecione uma opção abaixo para abrir um ticket."
      )
      .setImage("LINK_DA_SUA_BANNER")
      .setColor("#0099ff");

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("Selecione uma opção para abrir o ticket...")
      .addOptions([
        {
          label: "Suporte",
          value: "suporte",
          emoji: "🎫"
        },
        {
          label: "Compras",
          value: "compras",
          emoji: "🛒"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.login(process.env.TOKEN);
