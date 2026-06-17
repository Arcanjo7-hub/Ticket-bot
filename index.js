const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle } = require("discord.js");
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
    console.log(`✅ Logado como ${client.user.tag}`);
    
    try {
        await client.application.commands.set([
            { name: 'painel', description: '📋 Cria o painel de tickets' }
        ]);
        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
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
                .setTitle("🎯 Central de Suporte - Arcanjo")
                .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
                .setColor("#ffffff")
                .setImage(PANEL_IMAGE_URL)
                .setFooter({ text: "Clique em uma opção abaixo para começar", iconURL: client.user.avatarURL() })
                .setTimestamp();

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket")
                .setPlaceholder("📌 Selecione uma opção para abrir o ticket...")
                .addOptions([
                    { 
                        label: "🎧 Suporte", 
                        description: "Clique aqui para obter suporte!", 
                        value: "suporte",
                        emoji: "🎧"
                    },
                    { 
                        label: "📦 Receber Produto", 
                        description: "Clique aqui para receber manualmente!", 
                        value: "produto",
                        emoji: "📦"
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);
            await panelChannel.send({ embeds: [embed], components: [row] });
            console.log("✅ Painel enviado com sucesso!");
        }
    } catch (error) {
        console.error("❌ Erro ao enviar o painel:", error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
        const embed = new EmbedBuilder()
            .setTitle("🎯 Central de Suporte - Arcanjo")
            .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
            .setColor("#ffffff")
            .setImage(PANEL_IMAGE_URL)
            .setFooter({ text: "Clique em uma opção abaixo para começar", iconURL: client.user.avatarURL() })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId("ticket")
            .setPlaceholder("📌 Selecione uma opção para abrir o ticket...")
            .addOptions([
                { 
                    label: "🎧 Suporte", 
                    description: "Clique aqui para obter suporte!", 
                    value: "suporte",
                    emoji: "🎧"
                },
                { 
                    label: "📦 Receber Produto", 
                    description: "Clique aqui para receber manualmente!", 
                    value: "produto",
                    emoji: "📦"
                }
            ]);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "ticket") {
        await interaction.deferReply({ ephemeral: true });

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
            name: `🎫-ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent,
            permissionOverwrites: permissionOverwrites
        });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle("🎫 TICKET SUPORTE")
            .setDescription("❤️ Bem vindo ao canal oficial de suporte da Arcanjo Store\n\n➡️ **SUPORTE:** 12:00 as 23:00\n\n⚠️ Qualquer suporte fora desse horário será ignorado\n\n🚪 Caso deseje sair do atendimento use o botão **Sair Ticket**\n\n📋 Descreva seu problema com o máximo de detalhes possível para agilizar o atendimento!")
            .setColor("#00ff00")
            .setThumbnail(TICKET_IMAGE_URL)
            .setFooter({ text: `Ticket aberto por ${interaction.user.username}`, iconURL: interaction.user.avatarURL() })
            .setTimestamp();

        const finalizeButton = new ButtonBuilder()
            .setCustomId('finalize_ticket')
            .setLabel('✅ Finalizar Ticket')
            .setStyle(ButtonStyle.Success);

        const assumeButton = new ButtonBuilder()
            .setCustomId('assume_ticket')
            .setLabel('🔧 Assumir Ticket')
            .setStyle(ButtonStyle.Secondary);

        const staffPanelButton = new ButtonBuilder()
            .setCustomId('staff_panel')
            .setLabel('🛡️ Painel Staff')
            .setStyle(ButtonStyle.Secondary);

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave_ticket')
            .setLabel('🚪 Sair Ticket')
            .setStyle(ButtonStyle.Danger);

        const buttonRow1 = new ActionRowBuilder().addComponents(finalizeButton, assumeButton);
        const buttonRow2 = new ActionRowBuilder().addComponents(staffPanelButton, leaveButton);

        const welcomeMessage = await canal.send({
            embeds: [welcomeEmbed],
            components: [buttonRow1, buttonRow2]
        });

        await welcomeMessage.react('❤️');
        
        const successEmbed = new EmbedBuilder()
            .setTitle("✅ Ticket Criado!")
            .setDescription(`Seu ticket foi criado com sucesso!\n\n🔗 Acesse aqui: ${canal}`)
            .setColor("#00ff00")
            .setFooter({ text: "A equipe de suporte em breve estará com você", iconURL: client.user.avatarURL() });
        
        await interaction.editReply({ embeds: [successEmbed] });
    }

    if (interaction.isButton()) {
        if (interaction.customId === 'finalize_ticket') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ Acesso Negado")
                    .setDescription("Apenas membros da staff podem finalizar tickets.")
                    .setColor("#ff0000");
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            await interaction.deferReply();
            
            let messages = await interaction.channel.messages.fetch({ limit: 100 });
            messages = messages.reverse();
            let transcriptContent = `═══════════════════════════════════════\n`;
            transcriptContent += `TRANSCRIPT DO TICKET: ${interaction.channel.name}\n`;
            transcriptContent += `Finalizado por: ${interaction.user.tag}\n`;
            transcriptContent += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
            transcriptContent += `═══════════════════════════════════════\n\n`;
            
            messages.forEach(msg => {
                transcriptContent += `[${msg.createdAt.toLocaleString('pt-BR')}] ${msg.author.tag}: ${msg.content}\n`;
            });
            
            transcriptContent += `\n═══════════════════════════════════════\n`;
            transcriptContent += `FIM DO TRANSCRIPT\n`;
            transcriptContent += `═══════════════════════════════════════`;

            const transcriptFileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
            fs.writeFileSync(transcriptFileName, transcriptContent);

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("📋 Ticket Finalizado")
                    .setDescription(`**Ticket:** ${interaction.channel.name}\n**Finalizado por:** ${interaction.user}\n**Data:** ${new Date().toLocaleString('pt-BR')}`)
                    .setColor("#00ff00")
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed], files: [transcriptFileName] });
            }

            const finalEmbed = new EmbedBuilder()
                .setTitle("✅ Ticket Finalizado")
                .setDescription("O ticket foi finalizado e o transcript foi salvo.")
                .setColor("#00ff00");
            
            await interaction.editReply({ embeds: [finalEmbed] });
            setTimeout(() => interaction.channel.delete(), 2000);
            fs.unlinkSync(transcriptFileName);
        }

        if (interaction.customId === 'assume_ticket') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ Acesso Negado")
                    .setDescription("Apenas membros da staff podem assumir tickets.")
                    .setColor("#ff0000");
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const assumeEmbed = new EmbedBuilder()
                .setTitle("🔧 Ticket Assumido")
                .setDescription(`${interaction.user} assumiu o ticket!`)
                .setColor("#0099ff")
                .setTimestamp();
            
            await interaction.reply({ embeds: [assumeEmbed] });
        }

        if (interaction.customId === 'staff_panel') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ Acesso Negado")
                    .setDescription("Apenas membros da staff podem acessar o painel.")
                    .setColor("#ff0000");
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const panelEmbed = new EmbedBuilder()
                .setTitle("🛡️ Painel Staff")
                .setDescription("Painel Staff - Em desenvolvimento")
                .setColor("#0099ff");
            
            await interaction.reply({ embeds: [panelEmbed], ephemeral: true });
        }

        if (interaction.customId === 'leave_ticket') {
            await interaction.deferReply();
            
            let messages = await interaction.channel.messages.fetch({ limit: 100 });
            messages = messages.reverse();
            let transcriptContent = `═══════════════════════════════════════\n`;
            transcriptContent += `TRANSCRIPT DO TICKET: ${interaction.channel.name}\n`;
            transcriptContent += `Fechado por: ${interaction.user.tag}\n`;
            transcriptContent += `Data: ${new Date().toLocaleString('pt-BR')}\n`;
            transcriptContent += `═══════════════════════════════════════\n\n`;
            
            messages.forEach(msg => {
                transcriptContent += `[${msg.createdAt.toLocaleString('pt-BR')}] ${msg.author.tag}: ${msg.content}\n`;
            });
            
            transcriptContent += `\n═══════════════════════════════════════\n`;
            transcriptContent += `FIM DO TRANSCRIPT\n`;
            transcriptContent += `═══════════════════════════════════════`;

            const transcriptFileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
            fs.writeFileSync(transcriptFileName, transcriptContent);

            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("📋 Ticket Fechado")
                    .setDescription(`**Ticket:** ${interaction.channel.name}\n**Fechado por:** ${interaction.user}\n**Data:** ${new Date().toLocaleString('pt-BR')}`)
                    .setColor("#ff9900")
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed], files: [transcriptFileName] });
            }

            const closeEmbed = new EmbedBuilder()
                .setTitle("🚪 Ticket Fechado")
                .setDescription("O ticket foi fechado e o transcript foi salvo.")
                .setColor("#ff9900");
            
            await interaction.editReply({ embeds: [closeEmbed] });
            setTimeout(() => interaction.channel.delete(), 2000);
            fs.unlinkSync(transcriptFileName);
        }
    }
});

client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("🤖 Bot Online e Operacional");
}).listen(PORT, () => {
    console.log(`✅ Servidor de monitoramento rodando na porta ${PORT}`);
});
