const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ============================================
// TOKEN DO BOT - VIA VARIÁVEL DE AMBIENTE (SEGURO)
// ============================================
const TOKEN = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// ============================================
// CONFIGURAÇÕES DE CANAIS E ROLES
// ============================================
const STAFF_ROLE_IDS = ["1516106010950111447", "1516106010950111448", "1516106010950111451", "1516106010950111450", "1516106010950111449", "1516106010950111446"];
const LOG_CHANNEL_ID = "1516106012560461864";
const PANEL_CHANNEL_ID = "1516106012275511301";
const SALES_CHANNEL_ID = "1516106012560461864";

// Banners de referência (Substitua pelos seus links se desejar)
const BANNER_ATENDIMENTO = "https://media.discordapp.net/attachments/1265730104840224859/1265730416309108849/ATENDIMENTO.png";
const BANNER_PRODUTOS = "https://media.discordapp.net/attachments/1265730104840224859/1265730416309108849/PRODUTOS.png";

const COLORS = {
    invisible: "#2b2d31", // Cor de fundo do Discord
    white: "#ffffff",
    success: "#00ff00",
    accent: "#d4af37",
    danger: "#ff0000"
};

const PIX_KEY = "sua_chave_pix_aqui";
const PIX_OWNER_NAME = "Arcanjo Store";

// ============================================
// DADOS DE PRODUTOS (PERSISTÊNCIA SIMPLIFICADA)
// ============================================
let produtos = {
    "exemplo": { 
        nome: "Contas Nitradas", 
        preco: 5.35, 
        descricao: "• Contas full acesso\n• Todos os benefícios do Nitro Gaming\n• Contas recentes com até 1 ano de criação\n• Qualidade Premium (Ultra Alta Qualidade)\n• Website para login: @afhamxmailz",
        foto: BANNER_PRODUTOS,
        ativo: true
    }
};

let carrinhos = {};

// ============================================
// INICIALIZAÇÃO E COMANDOS
// ============================================
client.once("ready", async () => {
    console.log(`✅ Logado como ${client.user.tag}`);
    try {
        await client.application.commands.set([
            { name: 'painel', description: 'Envia o painel de atendimento' },
            { name: 'loja', description: 'Envia o catálogo de produtos' },
            { name: 'criar_produto', description: 'Criar um novo produto' },
            { name: 'editar_produto', description: 'Editar um produto existente' },
            { name: 'listar_produtos', description: 'Listar todos os produtos' },
            { name: 'deletar_produto', description: 'Deletar um produto' }
        ]);
    } catch (e) { console.error(e); }
});

// ============================================
// HANDLER DE INTERAÇÕES
// ============================================
client.on(Events.InteractionCreate, async interaction => {

    // --- COMANDO /PAINEL (VISUAL DA FOTO) ---
    if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
        const embed = new EmbedBuilder()
            .setTitle("Central de Suporte - Leasy")
            .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
            .setColor(COLORS.invisible)
            .setImage(BANNER_ATENDIMENTO);

        const menu = new StringSelectMenuBuilder()
            .setCustomId("ticket")
            .setPlaceholder("Selecione uma opção para abrir o ticket...")
            .addOptions([
                { label: "Suporte", value: "suporte", emoji: "📩" },
                { label: "Vendas", value: "vendas", emoji: "💰" }
            ]);

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    }

    // --- COMANDO /LOJA (VISUAL DA FOTO) ---
    if (interaction.isChatInputCommand() && interaction.commandName === "loja") {
        const ativos = Object.entries(produtos).filter(([_, p]) => p.ativo);
        if (ativos.length === 0) return interaction.reply({ content: "❌ Nenhum produto ativo!", ephemeral: true });

        const [firstId, firstProd] = ativos[0];
        const embed = new EmbedBuilder()
            .setTitle(firstProd.nome)
            .setDescription(firstProd.descricao + "\n\n**Vendas realizadas: 2452**")
            .setColor(COLORS.invisible)
            .setImage(firstProd.foto);

        const menu = new StringSelectMenuBuilder()
            .setCustomId("loja_produtos")
            .setPlaceholder("Selecione um Produto")
            .addOptions(ativos.map(([id, p]) => ({
                label: p.nome,
                description: `R$ ${p.preco.toFixed(2).replace('.', ',')}`,
                value: id,
                emoji: "🛒"
            })));

        await interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
    }

    // --- SELEÇÃO DE PRODUTO ---
    if (interaction.isStringSelectMenu() && interaction.customId === "loja_produtos") {
        const prodId = interaction.values[0];
        const prod = produtos[prodId];

        if (!carrinhos[interaction.user.id]) carrinhos[interaction.user.id] = { produtos: [], total: 0 };
        carrinhos[interaction.user.id].produtos.push(prod);
        carrinhos[interaction.user.id].total += prod.preco;

        const embed = new EmbedBuilder()
            .setTitle("🛒 Carrinho Atualizado")
            .setDescription(`**${prod.nome}** adicionado!\n\n💰 Total: R$ ${carrinhos[interaction.user.id].total.toFixed(2).replace('.', ',')}`)
            .setColor(COLORS.accent);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ver_carrinho').setLabel('Ver Carrinho').setStyle(ButtonStyle.Primary).setEmoji('🛒'),
            new ButtonBuilder().setCustomId('limpar_carrinho').setLabel('Limpar').setStyle(ButtonStyle.Danger)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // --- VER CARRINHO / PAGAR ---
    if (interaction.isButton() && interaction.customId === 'ver_carrinho') {
        const car = carrinhos[interaction.user.id];
        if (!car || car.produtos.length === 0) return interaction.reply({ content: "Vazio!", ephemeral: true });

        const lista = car.produtos.map((p, i) => `${i+1}. ${p.nome} - R$ ${p.preco.toFixed(2)}`).join('\n');
        const embed = new EmbedBuilder().setTitle("Seu Carrinho").setDescription(`${lista}\n\n**Total: R$ ${car.total.toFixed(2).replace('.', ',')}**`).setColor(COLORS.accent);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('pagar_pix').setLabel('Pagar com PIX').setStyle(ButtonStyle.Success).setEmoji('💳'));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'pagar_pix') {
        const car = carrinhos[interaction.user.id];
        const embed = new EmbedBuilder()
            .setTitle("Pagamento PIX")
            .setDescription(`Total: R$ ${car.total.toFixed(2)}\n\nChave: \`${PIX_KEY}\`\nTitular: ${PIX_OWNER_NAME}`)
            .setColor(COLORS.success)
            .setImage("https://via.placeholder.com/300?text=QR+CODE+PIX");
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('confirmar_pagamento').setLabel('Confirmar Pagamento').setStyle(ButtonStyle.Success));
        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // --- CONFIRMAR ENTREGA (VISUAL DA FOTO) ---
    if (interaction.isButton() && interaction.customId === 'confirmar_pagamento') {
        const car = carrinhos[interaction.user.id];
        if (!car || car.produtos.length === 0) return;

        const entregaEmbed = new EmbedBuilder()
            .setTitle("🔒 Entrega Realizada!")
            .setDescription(`O usuário **${interaction.user.username}** teve seu pedido entregue.`)
            .setColor(COLORS.white)
            .addFields(
                { name: "Carrinho", value: car.produtos.map(p => `1x ${p.nome}`).join('\n'), inline: false },
                { name: "Valor pago", value: `R$ ${car.total.toFixed(2).replace('.', ',')}`, inline: false }
            )
            .setFooter({ text: `Arcanjo Store • ${new Date().toLocaleString('pt-BR')}` });

        const salesChan = interaction.guild.channels.cache.get(SALES_CHANNEL_ID);
        if (salesChan) await salesChan.send({ embeds: [entregaEmbed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('f').setLabel('Feedbacks').setStyle(ButtonStyle.Secondary).setEmoji('🏆'))] });
        
        await interaction.reply({ content: "✅ Entrega realizada!", ephemeral: true });
        carrinhos[interaction.user.id] = { produtos: [], total: 0 };
    }

    // --- ABERTURA DE TICKET (VISUAL DA FOTO) ---
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket") {
        await interaction.deferReply({ ephemeral: true });
        const canal = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
                ...STAFF_ROLE_IDS.map(id => ({ id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }))
            ]
        });

        const embed = new EmbedBuilder().setTitle(`suporte-${interaction.user.username}`).setDescription(`Iniciada por **${interaction.user.username}**`).setColor(COLORS.invisible);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('staff_panel').setLabel('Painel do Atendente').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('user_panel').setLabel('Painel do Usuário').setStyle(ButtonStyle.Secondary).setEmoji('👤'),
            new ButtonBuilder().setCustomId('info').setLabel(' ').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
        );

        await canal.send({ content: `${interaction.user} @everyone`, embeds: [embed], components: [row] });
        await interaction.editReply({ content: `✅ Ticket: ${canal}` });
    }

    // --- TRANSCRIPT E FINALIZAÇÃO ---
    if (interaction.isButton() && interaction.customId === 'staff_panel') {
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('close').setLabel('Fechar com Transcript').setStyle(ButtonStyle.Danger));
        await interaction.reply({ content: "Ações Staff:", components: [row], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'close') {
        await interaction.deferReply();
        const msgs = await interaction.channel.messages.fetch({ limit: 100 });
        let transcript = `TRANSCRIPT: ${interaction.channel.name}\n\n` + msgs.reverse().map(m => `[${m.createdAt.toLocaleString()}] ${m.author.tag}: ${m.content}`).join('\n');
        const file = `transcript-${interaction.channel.id}.txt`;
        fs.writeFileSync(file, transcript);
        const log = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (log) await log.send({ content: `Ticket finalizado.`, files: [file] });
        await interaction.editReply("✅ Fechando...");
        setTimeout(() => { interaction.channel.delete(); fs.unlinkSync(file); }, 3000);
    }

    // --- COMANDOS ADMINISTRATIVOS (DO CÓDIGO ORIGINAL) ---
    if (interaction.isChatInputCommand() && interaction.commandName === "criar_produto") {
        const isStaff = STAFF_ROLE_IDS.some(id => interaction.member.roles.cache.has(id));
        if (!isStaff) return interaction.reply({ content: "❌ Sem permissão!", ephemeral: true });
        const modal = new ModalBuilder().setCustomId('modal_criar').setTitle('Criar Produto');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('n').setLabel('Nome').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p').setLabel('Preço').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('d').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('f').setLabel('URL Foto').setStyle(TextInputStyle.Short).setRequired(true))
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_criar') {
        const n = interaction.fields.getTextInputValue('n');
        const p = parseFloat(interaction.fields.getTextInputValue('p'));
        const d = interaction.fields.getTextInputValue('d');
        const f = interaction.fields.getTextInputValue('f');
        const id = `p_${Date.now()}`;
        produtos[id] = { nome: n, preco: p, descricao: d, foto: f, ativo: true };
        await interaction.reply({ content: `✅ Produto **${n}** criado!`, ephemeral: true });
    }

    if (interaction.isChatInputCommand() && interaction.commandName === "listar_produtos") {
        let txt = Object.entries(produtos).map(([id, p]) => `ID: \`${id}\` | **${p.nome}** - R$ ${p.preco}`).join('\n');
        await interaction.reply({ content: txt || "Nenhum produto.", ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'limpar_carrinho') {
        carrinhos[interaction.user.id] = { produtos: [], total: 0 };
        await interaction.reply({ content: "🗑️ Limpo!", ephemeral: true });
    }
});

client.login(TOKEN);
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => { res.writeHead(200); res.end("Online"); }).listen(PORT);
