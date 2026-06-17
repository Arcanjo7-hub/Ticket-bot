const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle } = require("discord.js");
const http = require("http");
const fs = require("fs"); // Para salvar o transcript

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Variáveis de ambiente para personalização e IDs
// Múltiplos cargos de staff separados por vírgula
const STAFF_ROLE_IDS = [
    "1516106010950111447",
    "1516106010950111448",
    "1516106010950111451",
    "1516106010950111450",
    "1516106010950111449",
    "1516106010950111446"
];

const LOG_CHANNEL_ID = "1516106012560461864"; // ID do canal onde os transcripts serão enviados
const PANEL_THUMBNAIL_URL = "https://imgur.com/a/ES3JmnT"; // URL da imagem para o painel
const PANEL_COLOR = "#0099ff"; // Cor do embed do painel (azul)

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

// 2. ESCUTANDO AS INTERAÇÕES (COMANDOS, MENUS E BOTÕES)
client.on(Events.InteractionCreate, async interaction => {
    // Se for o comando /painel
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "painel") {
            const embed = new EmbedBuilder()
                .setTitle("Central de Suporte")
                .setDescription("Selecione uma opção abaixo para abrir um ticket.")
                .setColor(PANEL_COLOR)
                .setThumbnail(PANEL_THUMBNAIL_URL);

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
            await interaction.deferReply({ ephemeral: true }); // Deferir a resposta para evitar timeout

            const permissionOverwrites = [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] }, // Esconde de todos
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] } // Permite ao usuário
            ];

            // Adiciona permissão para todos os cargos de staff
            for (const staffRoleId of STAFF_ROLE_IDS) {
                const staffRole = interaction.guild.roles.cache.get(staffRoleId);
                if (staffRole) {
                    permissionOverwrites.push({
                        id: staffRole.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    });
                }
            }

            const canal = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: interaction.channel.parent, // Cria no mesmo grupo de canais
                permissionOverwrites: permissionOverwrites
            });

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Fechar Ticket')
                .setStyle(ButtonStyle.Danger);

            const buttonRow = new ActionRowBuilder().addComponents(closeButton);

            await canal.send({
                content: `${interaction.user} seu ticket foi criado com sucesso! Um membro da equipe entrará em contato em breve.`, 
                components: [buttonRow]
            });
            await interaction.editReply({ content: `Seu ticket foi criado aqui: ${canal}` });
        }
    }

    // Se for o botão de fechar ticket
    if (interaction.isButton()) {
        if (interaction.customId === 'close_ticket') {
            // Verifica se quem clicou é o dono do ticket ou um membro da staff
            const isTicketOwner = interaction.channel.name.includes(interaction.user.username);
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));

            if (!isTicketOwner && !isStaff) {
                return interaction.reply({ content: 'Você não tem permissão para fechar este ticket.', ephemeral: true });
            }

            await interaction.deferReply(); // Deferir a resposta para evitar timeout

            // Gerar transcript
            let messages = await interaction.channel.messages.fetch({ limit: 100 });
            messages = messages.reverse(); // Para ter a ordem correta da conversa
            let transcriptContent = `Transcript do Ticket: ${interaction.channel.name}\n\n`;
            messages.forEach(msg => {
                transcriptContent += `${msg.author.tag}: ${msg.content}\n`;
            });

            const transcriptFileName = `transcript-${interaction.channel.name}.txt`;
            fs.writeFileSync(transcriptFileName, transcriptContent);

            // Enviar transcript para o canal de logs
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ 
                    content: `Ticket ${interaction.channel.name} fechado por ${interaction.user}.`, 
                    files: [transcriptFileName] 
                });
            } else {
                console.warn(`Canal de logs com ID ${LOG_CHANNEL_ID} não encontrado.`);
            }

            await interaction.editReply('Ticket fechado e transcript gerado.');
            await interaction.channel.delete(); // Apaga o canal do ticket
            fs.unlinkSync(transcriptFileName); // Apaga o arquivo local do transcript
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
