const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events } = require("discord.js");
const http = require("http");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 1. EVENTO QUANDO O BOT LIGA
client.once("ready", async () => {
    console.log(`Logado como ${client.user.tag}`);
    
    // REGISTRA O COMANDO /PAINEL NO DISCORD
    const commands = [{
        name: 'painel',
        description: 'Cria o painel de tickets'
    }];

    try {
        await client.application.commands.set(commands);
        console.log("Comandos registrados com sucesso!");
    } catch (error) {
        console.error("Erro ao registrar comandos:", error);
    }
});

// 2. ESCUTANDO AS INTERAÇÕES (COMANDOS E MENUS)
client.on(Events.InteractionCreate, async interaction => {
    // Se for o comando /painel
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "painel") {
            const embed = new EmbedBuilder()
                .setTitle("Central de Suporte")
                .setDescription("Selecione uma opção abaixo para abrir um ticket.")
                .setColor("#0099ff");

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket")
                .setPlaceholder("Escolha uma opção")
                .addOptions([
                    { label: "Suporte", description: "Falar com a equipe", value: "suporte" },
                    { label: "Receber produto", description: "Resgatar sua compra", value: "produto" }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ embeds: [embed], components: [row] });
        }
    }

    // Se for a seleção no menu (Abrir o Ticket)
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "ticket") {
            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel] }
                ]
            });

            await canal.send(`<LaTex>${interaction.user} seu ticket foi criado com sucesso! Aguarde o atendimento.`);
            await interaction.reply({ content: `Seu ticket foi criado aqui: $</LaTex>{canal}`, ephemeral: true });
        }
    }
});

// 3. LOGIN DO BOT
client.login(process.env.TOKEN);

// 4. SERVIDOR PARA O RENDER NÃO DESLIGAR O BOT
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot Online e Operacional");
}).listen(PORT, () => {
    console.log(`Servidor de monitoramento rodando na porta ${PORT}`);
});
