const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ============================================
// TOKEN E CONFIGURAÇÕES
// ============================================
const TOKEN = process.env.TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const STAFF_ROLE_IDS = ["1516106010950111447", "1516106010950111448", "1516106010950111451", "1516106010950111450", "1516106010950111449", "1516106010950111446"];
const OWNER_ROLE_ID = "1516106010950111450";
const AUXILIAR_ROLE_ID = "1516106010950111449";
const DONO_ROLE_ID = "1516106010950111446";

const LOG_CHANNEL_ID = "1516106012560461864";
const SALES_CHANNEL_ID = "1516106012560461864";

const BANNER_ATENDIMENTO = "https://media.discordapp.net/attachments/1265730104840224859/1265730416309108849/ATENDIMENTO.png";
const BANNER_PRODUTOS = "https://media.discordapp.net/attachments/1265730104840224859/1265730416309108849/PRODUTOS.png";

const COLORS = { invisible: "#2b2d31", white: "#ffffff", success: "#00ff00", accent: "#d4af37" };

let produtos = {
    "nitrada": { 
        nome: "Contas Nitradas", 
        preco: 5.35, 
        descricao: "• Contas full acesso\n• Todos os benefícios do Nitro Gaming\n• Contas recentes com até 1 ano de criação\n• Qualidade Premium (Ultra Alta Qualidade)\n• Website para login: @afhamxmailz",
        foto: BANNER_PRODUTOS,
        ativo: true
    }
};

let carrinhos = {};

// ============================================
// INICIALIZAÇÃO
// ============================================
client.once("ready", async () => {
    console.log(`✅ Logado como ${client.user.tag}`);
    try {
        await client.application.commands.set([
            { name: 'painel', description: 'Envia o painel de atendimento' },
            { name: 'loja', description: 'Envia o catálogo de produtos' },
            { name: 'config_pix', description: 'Configura os dados do PIX' }
        ]);
    } catch (e) { console.error(e); }
});

// ============================================
// HANDLER DE INTERAÇÕES
// ============================================
client.on(Events.InteractionCreate, async interaction => {

    // --- PAINEL DE ATENDIMENTO ---
    if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
        const embed = new EmbedBuilder()
            .setTitle("Central de Suporte - Leasy")
            .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
            .setColor(COLORS.invisible)
            .setImage(BANNER_ATENDIMENTO);

        const menu = new StringSelectMenuBuilder()
            .setCustomId("ticket_open")
            .setPlaceholder("Selecione uma opção para abrir o ticket...")
            .addOptions([
                { label: "Suporte", value: "suporte", emoji: "📩" },
                { label: "Vendas", value: "vendas", emoji: "💰" }
            ]);

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    }

    // --- ABERTURA DE TICKET ---
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket_open") {
        await interaction.deferReply({ ephemeral: true });

        const canal = await interaction.guild.channels.create({
            name: `${interaction.values[0]}-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ...STAFF_ROLE_IDS.map(id => ({ id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle(`${interaction.values[0]}-${interaction.user.username}`)
            .setDescription(`Iniciada por **${interaction.user.username}**`)
            .setColor(COLORS.invisible);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('staff_panel_btn').setLabel('Painel do Atendente').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('user_panel_btn').setLabel('Painel do Usuário').setStyle(ButtonStyle.Secondary).setEmoji('👤'),
            new ButtonBuilder().setCustomId('info_btn').setLabel(' ').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
        );

        // Marcações dos cargos conforme pedido
        let mentions = `${interaction.user} <@&${OWNER_ROLE_ID}> <@&${AUXILIAR_ROLE_ID}> <@&${DONO_ROLE_ID}>`;
        STAFF_ROLE_IDS.forEach(id => { if(!mentions.includes(id)) mentions += ` <@&${id}>`; });

        await canal.send({ content: mentions, embeds: [embed], components: [row] });
        await interaction.editReply({ content: `✅ Ticket aberto em ${canal}` });
    }

    // --- PAINEL DO ATENDENTE (STAFF) ---
    if (interaction.isButton() && interaction.customId === 'staff_panel_btn') {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: "❌ Apenas a Staff pode acessar este painel!", ephemeral: true });

        const embed = new EmbedBuilder()
            .setTitle("🛡️ Painel do Atendente")
            .setDescription("Gerencie este atendimento através dos botões abaixo.")
            .setColor(COLORS.invisible);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('assume_ticket').setLabel('Assumir').setStyle(ButtonStyle.Primary).setEmoji('🔧'),
            new ButtonBuilder().setCustomId('finalize_ticket').setLabel('Finalizar').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId('delete_ticket').setLabel('Deletar').setStyle(ButtonStyle.Danger).setEmoji('🗑️')
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // --- ASSUMIR TICKET ---
    if (interaction.isButton() && interaction.customId === 'assume_ticket') {
        await interaction.channel.send({ content: `🔧 O atendente ${interaction.user} assumiu este ticket!` });
        await interaction.reply({ content: "✅ Você assumiu o ticket.", ephemeral: true });
    }

    // --- FINALIZAR TICKET COM TRANSCRIPT ---
    if (interaction.isButton() && interaction.customId === 'finalize_ticket') {
        await interaction.reply({ content: "⏳ Gerando transcript e finalizando...", ephemeral: true });
        
        const msgs = await interaction.channel.messages.fetch({ limit: 100 });
        let transcript = `TRANSCRIPT - ${interaction.channel.name}\n\n`;
        msgs.reverse().forEach(m => {
            transcript += `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}\n`;
        });

        const file = `transcript-${interaction.channel.id}.txt`;
        fs.writeFileSync(file, transcript);

        const log = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (log) await log.send({ content: `📋 Ticket **${interaction.channel.name}** finalizado por ${interaction.user}`, files: [file] });

        await interaction.channel.send("✅ Ticket finalizado. O canal será excluído em 5 segundos.");
        setTimeout(() => { interaction.channel.delete(); fs.unlinkSync(file); }, 5000);
    }

    // --- LOJA / PRODUTOS ---
    if (interaction.isChatInputCommand() && interaction.commandName === "loja") {
        const prod = produtos["nitrada"];
        const embed = new EmbedBuilder()
            .setTitle(prod.nome)
            .setDescription(prod.descricao + "\n\n**2452 vendas realizadas**")
            .setColor(COLORS.invisible)
            .setImage(prod.foto);

        const menu = new StringSelectMenuBuilder()
            .setCustomId("buy_product")
            .setPlaceholder("Selecione um Produto")
            .addOptions([{ label: prod.nome, value: "nitrada", emoji: "🛒", description: `R$ ${prod.preco.toFixed(2)}` }]);

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    }

    // --- CARRINHO E PAGAMENTO ---
    if (interaction.isStringSelectMenu() && interaction.customId === "buy_product") {
        const prod = produtos[interaction.values[0]];
        carrinhos[interaction.user.id] = { prod, total: prod.preco };

        const embed = new EmbedBuilder()
            .setTitle("🛒 Produto no Carrinho")
            .setDescription(`Você selecionou: **${prod.nome}**\n\n💰 Valor: R$ ${prod.preco.toFixed(2).replace('.', ',')}`)
            .setColor(COLORS.accent);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('pay_pix').setLabel('Pagar com PIX').setStyle(ButtonStyle.Success).setEmoji('💳'),
            new ButtonBuilder().setCustomId('cancel_buy').setLabel('Cancelar').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'pay_pix') {
        const car = carrinhos[interaction.user.id];
        const embed = new EmbedBuilder()
            .setTitle("Pagamento PIX")
            .setDescription(`Valor: R$ ${car.total.toFixed(2)}\n\nChave PIX: \`${PIX_KEY}\`\nTitular: ${PIX_OWNER_NAME}`)
            .setColor(COLORS.success)
            .setImage("https://via.placeholder.com/300?text=QR+CODE+PIX");

        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confirm_pay').setLabel('Confirmar Pagamento').setStyle(ButtonStyle.Success));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // --- ENTREGA (ESTILO DA FOTO) ---
    if (interaction.isButton() && interaction.customId === 'confirm_pay') {
        const car = carrinhos[interaction.user.id];
        const entregaEmbed = new EmbedBuilder()
            .setTitle("🔒 Entrega Realizada!")
            .setDescription(`O usuário **${interaction.user.username}** teve seu pedido entregue.`)
            .setColor(COLORS.white)
            .addFields(
                { name: "Carrinho", value: `1x ${car.prod.nome}`, inline: false },
                { name: "Valor pago", value: `R$ ${car.total.toFixed(2).replace('.', ',')}`, inline: false }
            )
            .setFooter({ text: `Arcanjo Store • ${new Date().toLocaleString('pt-BR')}` });

        const salesChan = interaction.guild.channels.cache.get(SALES_CHANNEL_ID);
        if (salesChan) await salesChan.send({ embeds: [entregaEmbed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('fb').setLabel('Feedbacks').setStyle(ButtonStyle.Secondary).setEmoji('🏆'))] });
        
        await interaction.reply({ content: "✅ Pagamento confirmado!", ephemeral: true });
        delete carrinhos[interaction.user.id];
    }

});

client.login(TOKEN);
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end("Online"); }).listen(PORT);
