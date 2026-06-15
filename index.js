const {
Client,
GatewayIntentBits,
ChannelType,
PermissionsBitField,
ActionRowBuilder,
StringSelectMenuBuilder,
EmbedBuilder,
Events
} = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
console.log(`Logado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

if (interaction.isChatInputCommand()) {

if (interaction.commandName === "painel") {

const embed = new EmbedBuilder()
.setTitle("Central de Suporte")
.setDescription("Selecione uma opção abaixo.");

const menu = new StringSelectMenuBuilder()
.setCustomId("ticket")
.setPlaceholder("Escolha uma opção")
.addOptions([
{
label: "Suporte",
value: "suporte"
},
{
label: "Receber produto",
value: "produto"
}
]);

const row = new ActionRowBuilder().addComponents(menu);

await interaction.reply({
embeds: [embed],
components: [row]
});
}
}

if (interaction.isStringSelectMenu()) {

const canal = await interaction.guild.channels.create({
name: `ticket-${interaction.user.username}`,
type: ChannelType.GuildText,
permissionOverwrites: [
{
id: interaction.guild.id,
deny: [PermissionsBitField.Flags.ViewChannel]
},
{
id: interaction.user.id,
allow: [PermissionsBitField.Flags.ViewChannel]
}
]
});

await canal.send(
`${interaction.user} seu ticket foi criado.`
);

await interaction.reply({
content: `Ticket criado: ${canal}`,
ephemeral: true
});
}
});

client.login(process.env.TOKEN);
