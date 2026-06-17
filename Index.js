const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const http = require("http");
const fs = require("fs");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const STAFF_ROLE_IDS = [
    "1516106010950111447",
    "1516106010950111448",
    "1516106010950111451",
    "1516106010950111450",
    "1516106010950111449",
    "1516106010950111446"
];

const LOG_CHANNEL_ID = "1516106012560461864";
const PANEL_CHANNEL_ID = "1516106012275511301";
const PANEL_IMAGE_URL = "https://cdn.discordapp.com/attachments/1516106012275511301/1516604885691400252/40829CBF-219E-4D04-A9BB-505487EF29F5.png?ex=6a333fdd&is=6a31ee5d&hm=d5efbf429bbdae1b687ed8d27c0ccb9c73690cd4cc64119c577269eb67b56b0a";
const TICKET_IMAGE_URL = "https://cdn.discordapp.com/attachments/1510762037989605677/1516611165558407229/d464cd1bd49919f621767c029235f98f.jpg?ex=6a3345b7&is=6a31f437&hm=0bf696e16df92332e85d74dec5f2c670ce7bb9bc177b983a065b8f564ebb4377";

client.once("ready", async () => {
    console.log(`Logado como ${client.user.tag}`);
    
    try {
        await client.application.commands.set([
            { name: 'painel', description: 'Cria o painel de tickets' }
        ]);
        console.log("Comandos registrados com sucesso!");
    } catch (error) {
        console.error("Erro ao registrar comandos:", error);
    }

    try {
        const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID);
        if (panelChannel) {
            const messages = await panelChannel.messages.fetch({ limit: 10 });
            for (const message of messages.values()) {
                if (message.author.id === client.user.id) {
                    await message.delete().catch(() => {});
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("Central de Suporte - Arcanjo")
                .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
                .setColor("#ffffff")
                .setImage(PANEL_IMAGE_URL);

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket")
                .setPlaceholder("Selecione uma opção para abrir o ticket...")
                .addOptions([
                    { 
                        label: "Suporte", 
                        description: "Clique aqui para obter suporte!", 
                        value: "suporte",
                        emoji: "🎧"
                    },
                    { 
                        label: "Receber produto", 
                        description: "Clique aqui para receber manualmente!", 
                        value: "produto",
                        emoji: "📦"
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);
            await panelChannel.send({ embeds: [embed], components: [row] });
            console.log("Painel enviado com sucesso!");
        }
    } catch (error) {
        console.error("Erro ao enviar o painel:", error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            if (interaction.commandName === "painel") {
                const embed = new EmbedBuilder()
                    .setTitle("Central de Suporte - Arcanjo")
                    .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
                    .setColor("#ffffff")
                    .setImage(PANEL_IMAGE_URL);

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("ticket")
                    .setPlaceholder("Selecione uma opção para abrir o ticket...")
                    .addOptions([
                        { 
                            label: "Suporte", 
                            description: "Clique aqui para obter suporte!", 
                            value: "suporte",
                            emoji: "🎧"
                        },
                        { 
                            label: "Receber produto", 
                            description: "Clique aqui para receber manualmente!", 
                            value: "produto",
                            emoji: "📦"
                        }
                    ]);

                const row = new ActionRowBuilder().addComponents(menu);
                await interaction.reply({ embeds: [embed], components: [row] });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "ticket") {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                const permissionOverwrites = [
                    { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
                ];

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
                    parent: interaction.channel.parent,
                    permissionOverwrites: permissionOverwrites
                });

                const welcomeEmbed = new EmbedBuilder()
                    .setTitle("TICKET SUPORTE")
                    .setDescription("❤️ Bem vindo ao canal oficial de suporte da Arcanjo Store\n\n➡️ SUPORTE 12:00 as 23:00\n\n⚠️ Qualquer suporte fora desse horário será ignorado\n\n🚪 Caso deseje sair do atendimento use o botão Sair Ticket")
                    .setColor("#00ff00")
                    .setThumbnail(TICKET_IMAGE_URL);

                const finalizeButton = new ButtonBuilder()
                    .setCustomId('finalize_ticket')
                    .setLabel('Finalizar Ticket')
                    .setStyle(ButtonStyle.Success);

                const assumeButton = new ButtonBuilder()
                    .setCustomId('assume_ticket')
                    .setLabel('Assumir Ticket')
                    .setStyle(ButtonStyle.Secondary);

                const staffPanelButton = new ButtonBuilder()
                    .setCustomId('staff_panel')
                    .setLabel('Painel Staff')
                    .setStyle(ButtonStyle.Secondary);

                const leaveButton = new ButtonBuilder()
                    .setCustomId('leave_ticket')
                    .setLabel('Sair Ticket')
                    .setStyle(ButtonStyle.Danger);

                const buttonRow1 = new ActionRowBuilder().addComponents(finalizeButton, assumeButton);
                const buttonRow2 = new ActionRowBuilder().addComponents(staffPanelButton, leaveButton);

                const welcomeMessage = await canal.send({
                    embeds: [welcomeEmbed],
                    components: [buttonRow1, buttonRow2]
                });

                await welcomeMessage.react('❤️');
                await interaction.editReply({ content: `Seu ticket foi criado aqui: ${canal}` });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'finalize_ticket') {
                const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!isStaff) {
                    return interaction.reply({ content: 'Apenas membros da staff podem finalizar tickets.', flags: MessageFlags.Ephemeral });
                }

                await interaction.deferReply();
                let messages = await interaction.channel.messages.fetch({ limit: 100 });
                messages = messages.reverse();
                let transcriptContent = `Transcript do Ticket: ${interaction.channel.name}\n\n`;
                messages.forEach(msg => {
                    transcriptContent += `${msg.author.tag}: ${msg.content}\n`;
                });

                const transcriptFileName = `transcript-${interaction.channel.name}.txt`;
                fs.writeFileSync(transcriptFileName, transcriptContent);

                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    await logChannel.send({ 
                        content: `Ticket ${interaction.channel.name} finalizado por ${interaction.user}.`, 
                        files: [transcriptFileName] 
                    });
                }

                await interaction.editReply('Ticket finalizado e transcript gerado.');
                await interaction.channel.delete();
                fs.unlinkSync(transcriptFileName);
            }

            if (interaction.customId === 'assume_ticket') {
                const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!isStaff) {
                    return interaction.reply({ content: 'Apenas membros da staff podem assumir tickets.', flags: MessageFlags.Ephemeral });
                }
                await interaction.reply({ content: `✅ ${interaction.user} assumiu o ticket!` });
            }

            if (interaction.customId === 'staff_panel') {
                const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
                if (!isStaff) {
                    return interaction.reply({ content: 'Apenas membros da staff podem acessar o painel.', flags: MessageFlags.Ephemeral });
                }
                await interaction.reply({ content: 'Painel Staff - Em desenvolvimento', flags: MessageFlags.Ephemeral });
            }

            if (interaction.customId === 'leave_ticket') {
                await interaction.deferReply();
                let messages = await interaction.channel.messages.fetch({ limit: 100 });
                messages = messages.reverse();
                let transcriptContent = `Transcript do Ticket: ${interaction.channel.name}\n\n`;
                messages.forEach(msg => {
                    transcriptContent += `${msg.author.tag}: ${msg.content}\n`;
                });

                const transcriptFileName = `transcript-${interaction.channel.name}.txt`;
                fs.writeFileSync(transcriptFileName, transcriptContent);

                const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    await logChannel.send({ 
                        content: `Ticket ${interaction.channel.name} fechado por ${interaction.user}.`, 
                        files: [transcriptFileName] 
                    });
                }

                await interaction.editReply('Ticket fechado e transcript gerado.');
                await interaction.channel.delete();
                fs.unlinkSync(transcriptFileName);
            }
        }
    } catch (error) {
        console.error("Erro na interação:", error);
    }
});

client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot Online e Operacional");
}).listen(PORT, () => {
    console.log(`Servidor de monitoramento rodando na porta ${PORT}`);
});
