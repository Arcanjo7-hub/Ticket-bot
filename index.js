const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ============================================
// TOKEN DO BOT - INSERIDO DIRETAMENTE NO CÓDIGO
// ============================================
const TOKEN = "MTUxNjU5NDg2MTk5Mjg0MTI4Ng.GPJJS1.ya1J8pdLS4nB1mzYHSR06fQkdH9N-wPDFWj1TI";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// ============================================
// CONFIGURAÇÕES DE CANAIS E ROLES
// ============================================
const STAFF_ROLE_IDS = [
    "1516106010950111447",
    "1516106010950111448",
    "1516106010950111451",
    "1516106010950111450",
    "1516106010950111449",
    "1516106010950111446"
];

const OWNER_ROLE_ID = "1516106010950111450";
const AUXILIAR_ROLE_ID = "1516106010950111449";
const DONO_ROLE_ID = "1516106010950111446";

const LOG_CHANNEL_ID = "1516106012560461864";
const PANEL_CHANNEL_ID = "1516106012275511301";
const SALES_CHANNEL_ID = "1516106012560461864";
const PANEL_IMAGE_URL = "https://cdn.discordapp.com/attachments/1516106012275511301/1516604885691400252/40829CBF-219E-4D04-A9BB-505487EF29F5.png?ex=6a333fdd&is=6a31ee5d&hm=d5efbf429bbdae1b687ed8d27c0ccb9c73690cd4cc64119c577269eb67b56b0a";
const TICKET_IMAGE_URL = "https://cdn.discordapp.com/attachments/1510762037989605677/1516611165558407229/d464cd1bd49919f621767c029235f98f.jpg?ex=6a3345b7&is=6a31f437&hm=0bf696e16df92332e85d74dec5f2c670ce7bb9bc177b983a065b8f564ebb4377";

// ============================================
// CORES DO BOT
// ============================================
const COLORS = {
    primary: "#1a1a2e",
    accent: "#d4af37",
    success: "#00d084",
    danger: "#ff6b6b",
    info: "#4a90e2",
    white: "#ffffff",
    dark: "#2b2d31"
};

// ============================================
// CONFIGURAÇÕES DE PIX
// ============================================
const PIX_KEY = "sua_chave_pix_aqui";
const PIX_OWNER_NAME = "Arcanjo Store";

// ============================================
// DADOS DE PRODUTOS (configuráveis via comandos)
// ============================================
let produtos = {
    "produto1": { 
        nome: "Produto Premium 1", 
        preco: 50.00, 
        descricao: "Descrição do Produto 1",
        foto: "https://via.placeholder.com/600x400?text=Produto+1",
        ativo: true
    },
    "produto2": { 
        nome: "Produto Premium 2", 
        preco: 100.00, 
        descricao: "Descrição do Produto 2",
        foto: "https://via.placeholder.com/600x400?text=Produto+2",
        ativo: true
    },
    "produto3": { 
        nome: "Produto Premium 3", 
        preco: 75.00, 
        descricao: "Descrição do Produto 3",
        foto: "https://via.placeholder.com/600x400?text=Produto+3",
        ativo: true
    }
};

let carrinhos = {};

// ============================================
// BOT INICIALIZAÇÃO
// ============================================
client.once("ready", async () => {
    console.log(`✅ Logado como ${client.user.tag}`);
    
    // Registrar comandos slash
    try {
        await client.application.commands.set([
            { name: 'painel', description: 'Cria o painel de tickets' },
            { name: 'loja', description: 'Abre a loja de vendas' },
            { name: 'criar_produto', description: 'Criar um novo produto' },
            { name: 'editar_produto', description: 'Editar um produto existente' },
            { name: 'listar_produtos', description: 'Listar todos os produtos' },
            { name: 'deletar_produto', description: 'Deletar um produto' },
            { name: 'feedbacks', description: 'Abrir canal de feedbacks' }
        ]);
        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }

    // Enviar painel automaticamente no canal configurado
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
                .setTitle("Central de Suporte - Arcanjo Store")
                .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
                .setColor(COLORS.accent)
                .setImage(PANEL_IMAGE_URL)
                .setTimestamp();

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
            console.log("✅ Painel enviado com sucesso!");
        }
    } catch (error) {
        console.error("❌ Erro ao enviar o painel:", error);
    }
});

// ============================================
// HANDLER DE INTERAÇÕES
// ============================================
client.on(Events.InteractionCreate, async interaction => {

    // ==============================
    // COMANDO /PAINEL
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
        const embed = new EmbedBuilder()
            .setTitle("Central de Suporte - Arcanjo Store")
            .setDescription("Após solicitar atendimento, por favor, aguarde que um membro da nossa equipe lhe responda. O atendimento é realizado de forma privada, com acesso exclusivo da equipe.")
            .setColor(COLORS.accent)
            .setImage(PANEL_IMAGE_URL)
            .setTimestamp();

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

    // ==============================
    // COMANDO /LOJA
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "loja") {
        const produtosAtivos = Object.entries(produtos).filter(([_, p]) => p.ativo);
        
        if (produtosAtivos.length === 0) {
            return interaction.reply({ content: "❌ Nenhum produto disponível no momento!", ephemeral: true });
        }

        const lojaEmbed = new EmbedBuilder()
            .setTitle("Catálogo - Arcanjo Store")
            .setDescription("Explore nossos produtos disponíveis")
            .setColor(COLORS.accent)
            .setFooter({ text: `${produtosAtivos.length} produtos disponíveis` })
            .setTimestamp();

        const options = produtosAtivos.map(([id, produto]) => ({
            label: produto.nome,
            description: `R$ ${produto.preco.toFixed(2).replace('.', ',')}`,
            value: id,
            emoji: "💎"
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId("loja_produtos")
            .setPlaceholder("Selecione um Produto")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ embeds: [lojaEmbed], components: [row] });
    }

    // ==============================
    // COMANDO /CRIAR_PRODUTO
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "criar_produto") {
        const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode criar produtos!", ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('modal_criar_produto')
            .setTitle('Criar Novo Produto');

        const nomeInput = new TextInputBuilder()
            .setCustomId('produto_nome')
            .setLabel('Nome do Produto')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: Produto Premium')
            .setRequired(true);

        const precoInput = new TextInputBuilder()
            .setCustomId('produto_preco')
            .setLabel('Preço (R$)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex: 99.99')
            .setRequired(true);

        const descricaoInput = new TextInputBuilder()
            .setCustomId('produto_descricao')
            .setLabel('Descrição')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Descreva o produto...')
            .setRequired(true);

        const fotoInput = new TextInputBuilder()
            .setCustomId('produto_foto')
            .setLabel('URL da Foto')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://exemplo.com/foto.jpg')
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nomeInput);
        const row2 = new ActionRowBuilder().addComponents(precoInput);
        const row3 = new ActionRowBuilder().addComponents(descricaoInput);
        const row4 = new ActionRowBuilder().addComponents(fotoInput);

        modal.addComponents(row1, row2, row3, row4);
        await interaction.showModal(modal);
    }

    // ==============================
    // COMANDO /EDITAR_PRODUTO
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "editar_produto") {
        const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode editar produtos!", ephemeral: true });
        }

        const options = Object.entries(produtos).map(([id, produto]) => ({
            label: produto.nome,
            description: `R$ ${produto.preco.toFixed(2)}`,
            value: id,
            emoji: "✏️"
        }));

        if (options.length === 0) {
            return interaction.reply({ content: "❌ Nenhum produto para editar!", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('menu_editar_produto')
            .setPlaceholder('Selecione um produto para editar...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ components: [row], ephemeral: true });
    }

    // ==============================
    // COMANDO /LISTAR_PRODUTOS
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "listar_produtos") {
        const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode listar produtos!", ephemeral: true });
        }

        if (Object.keys(produtos).length === 0) {
            return interaction.reply({ content: "❌ Nenhum produto cadastrado!", ephemeral: true });
        }

        let descricao = "";
        Object.entries(produtos).forEach(([id, produto], index) => {
            const status = produto.ativo ? "✅" : "❌";
            descricao += `\n${index + 1}. ${status} **${produto.nome}**\n`;
            descricao += `   💰 R$ ${produto.preco.toFixed(2).replace('.', ',')}\n`;
            descricao += `   📝 ${produto.descricao}\n`;
            descricao += `   🆔 \`${id}\`\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("Produtos Cadastrados")
            .setDescription(descricao)
            .setColor(COLORS.accent)
            .setFooter({ text: `Total: ${Object.keys(produtos).length} produtos` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ==============================
    // COMANDO /DELETAR_PRODUTO
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "deletar_produto") {
        const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode deletar produtos!", ephemeral: true });
        }

        const options = Object.entries(produtos).map(([id, produto]) => ({
            label: produto.nome,
            description: `R$ ${produto.preco.toFixed(2)}`,
            value: id,
            emoji: "🗑️"
        }));

        if (options.length === 0) {
            return interaction.reply({ content: "❌ Nenhum produto para deletar!", ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('menu_deletar_produto')
            .setPlaceholder('Selecione um produto para deletar...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ components: [row], ephemeral: true });
    }

    // ==============================
    // COMANDO /FEEDBACKS
    // ==============================
    if (interaction.isChatInputCommand() && interaction.commandName === "feedbacks") {
        const feedbackChannel = interaction.channel;
        
        const embed = new EmbedBuilder()
            .setTitle("🏆 Feedbacks - Arcanjo Store")
            .setDescription("Este é o canal de feedbacks da nossa loja.\n\nDeixe sua opinião sobre os produtos e atendimento!")
            .setColor(COLORS.accent)
            .setTimestamp();

        const feedbackButton = new ButtonBuilder()
            .setCustomId('deixar_feedback')
            .setLabel('Deixar Feedback')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⭐');

        const row = new ActionRowBuilder().addComponents(feedbackButton);
        await interaction.reply({ embeds: [embed], components: [row] });
    }

    // ==============================
    // MODAL: Criar Produto
    // ==============================
    if (interaction.isModalSubmit() && interaction.customId === 'modal_criar_produto') {
        const nome = interaction.fields.getTextInputValue('produto_nome');
        const preco = parseFloat(interaction.fields.getTextInputValue('produto_preco'));
        const descricao = interaction.fields.getTextInputValue('produto_descricao');
        const foto = interaction.fields.getTextInputValue('produto_foto');

        if (isNaN(preco) || preco <= 0) {
            return interaction.reply({ content: "❌ Preço inválido! Use um número positivo.", ephemeral: true });
        }

        const id = `produto_${Date.now()}`;
        produtos[id] = { nome, preco, descricao, foto, ativo: true };

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Criado com Sucesso!")
            .setImage(foto)
            .setDescription(`**${nome}**\n\n💰 R$ ${preco.toFixed(2).replace('.', ',')}\n\n📝 ${descricao}`)
            .setColor(COLORS.success)
            .setFooter({ text: `ID: ${id}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ==============================
    // MENU: Editar Produto
    // ==============================
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_editar_produto') {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        const modal = new ModalBuilder()
            .setCustomId(`modal_editar_${produtoId}`)
            .setTitle(`Editar: ${produto.nome}`);

        const nomeInput = new TextInputBuilder()
            .setCustomId('produto_nome')
            .setLabel('Nome do Produto')
            .setStyle(TextInputStyle.Short)
            .setValue(produto.nome)
            .setRequired(true);

        const precoInput = new TextInputBuilder()
            .setCustomId('produto_preco')
            .setLabel('Preço (R$)')
            .setStyle(TextInputStyle.Short)
            .setValue(produto.preco.toString())
            .setRequired(true);

        const descricaoInput = new TextInputBuilder()
            .setCustomId('produto_descricao')
            .setLabel('Descrição')
            .setStyle(TextInputStyle.Paragraph)
            .setValue(produto.descricao)
            .setRequired(true);

        const fotoInput = new TextInputBuilder()
            .setCustomId('produto_foto')
            .setLabel('URL da Foto')
            .setStyle(TextInputStyle.Short)
            .setValue(produto.foto)
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nomeInput);
        const row2 = new ActionRowBuilder().addComponents(precoInput);
        const row3 = new ActionRowBuilder().addComponents(descricaoInput);
        const row4 = new ActionRowBuilder().addComponents(fotoInput);

        modal.addComponents(row1, row2, row3, row4);
        await interaction.showModal(modal);
    }

    // ==============================
    // MODAL: Editar Produto
    // ==============================
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_editar_')) {
        const produtoId = interaction.customId.replace('modal_editar_', '');
        const nome = interaction.fields.getTextInputValue('produto_nome');
        const preco = parseFloat(interaction.fields.getTextInputValue('produto_preco'));
        const descricao = interaction.fields.getTextInputValue('produto_descricao');
        const foto = interaction.fields.getTextInputValue('produto_foto');

        if (isNaN(preco) || preco <= 0) {
            return interaction.reply({ content: "❌ Preço inválido! Use um número positivo.", ephemeral: true });
        }

        produtos[produtoId] = { nome, preco, descricao, foto, ativo: produtos[produtoId].ativo };

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Atualizado!")
            .setImage(foto)
            .setDescription(`**${nome}**\n\n💰 R$ ${preco.toFixed(2).replace('.', ',')}\n\n📝 ${descricao}`)
            .setColor(COLORS.success)
            .setFooter({ text: `ID: ${produtoId}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ==============================
    // MENU: Deletar Produto
    // ==============================
    if (interaction.isStringSelectMenu() && interaction.customId === 'menu_deletar_produto') {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirmar_deletar_${produtoId}`)
            .setLabel('Confirmar Deleção')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️');

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancelar_deletar')
            .setLabel('Cancelar')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const embed = new EmbedBuilder()
            .setTitle("⚠️ Confirmar Deleção")
            .setImage(produto.foto)
            .setDescription(`Tem certeza que deseja deletar **${produto.nome}**?\n\nEsta ação não pode ser desfeita!`)
            .setColor(COLORS.danger);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // ==============================
    // BOTÕES: Deletar Produto
    // ==============================
    if (interaction.isButton() && interaction.customId.startsWith('confirmar_deletar_')) {
        const produtoId = interaction.customId.replace('confirmar_deletar_', '');
        const produto = produtos[produtoId];

        delete produtos[produtoId];

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Deletado!")
            .setImage(produto.foto)
            .setDescription(`**${produto.nome}** foi removido com sucesso!`)
            .setColor(COLORS.success);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.isButton() && interaction.customId === 'cancelar_deletar') {
        await interaction.reply({ content: "❌ Deleção cancelada!", ephemeral: true });
    }

    // ==============================
    // MODAL: Deixar Feedback
    // ==============================
    if (interaction.isButton() && interaction.customId === 'deixar_feedback') {
        const modal = new ModalBuilder()
            .setCustomId('modal_feedback')
            .setTitle('Deixar Feedback');

        const feedbackInput = new TextInputBuilder()
            .setCustomId('feedback_texto')
            .setLabel('Seu Feedback')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Conte sobre sua experiência com a Arcanjo Store...')
            .setMaxLength(1000)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(feedbackInput);
        modal.addComponents(row);
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'modal_feedback') {
        const texto = interaction.fields.getTextInputValue('feedback_texto');
        
        const feedbackEmbed = new EmbedBuilder()
            .setTitle(`⭐ Feedback de ${interaction.user.tag}`)
            .setDescription(texto)
            .setColor(COLORS.accent)
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
            .setTimestamp();

        await interaction.channel.send({ embeds: [feedbackEmbed] });
        await interaction.reply({ content: "✅ Feedback enviado com sucesso!", ephemeral: true });
    }

    // ==============================
    // MENU DE SELEÇÃO DE TICKETS
    // ==============================
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
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: interaction.channel.parent,
            permissionOverwrites: permissionOverwrites
        });

        const ownerRole = interaction.guild.roles.cache.get(OWNER_ROLE_ID);
        const auxiliarRole = interaction.guild.roles.cache.get(AUXILIAR_ROLE_ID);
        const donoRole = interaction.guild.roles.cache.get(DONO_ROLE_ID);

        let mentions = `${interaction.user}`;
        if (ownerRole) mentions += ` ${ownerRole}`;
        if (auxiliarRole) mentions += ` ${auxiliarRole}`;
        if (donoRole) mentions += ` ${donoRole}`;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle("TICKET SUPORTE PREMIUM")
            .setDescription("Bem-vindo ao canal oficial de suporte da Arcanjo Store\n\nAguarde que um membro da nossa equipe responda sua solicitação em breve.\n\nUse os botões abaixo para gerenciar o atendimento.")
            .setColor(COLORS.accent)
            .setThumbnail(TICKET_IMAGE_URL)
            .setFooter({ text: "Obrigado por entrar em contato!" })
            .setTimestamp();

        const finalizeButton = new ButtonBuilder()
            .setCustomId('finalize_ticket')
            .setLabel('Finalizar Ticket')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const assumeButton = new ButtonBuilder()
            .setCustomId('assume_ticket')
            .setLabel('Assumir Ticket')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔧');

        const staffPanelButton = new ButtonBuilder()
            .setCustomId('staff_panel')
            .setLabel('Painel Staff')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛡️');

        const leaveButton = new ButtonBuilder()
            .setCustomId('leave_ticket')
            .setLabel('Sair Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🚪');

        const buttonRow1 = new ActionRowBuilder().addComponents(finalizeButton, assumeButton);
        const buttonRow2 = new ActionRowBuilder().addComponents(staffPanelButton, leaveButton);

        await canal.send({
            content: mentions,
            embeds: [welcomeEmbed],
            components: [buttonRow1, buttonRow2]
        });
        
        const successEmbed = new EmbedBuilder()
            .setTitle("✅ Ticket Criado!")
            .setDescription(`Seu ticket foi criado com sucesso!\n\nAcesse aqui: ${canal}\n\nA equipe de suporte em breve estará com você.`)
            .setColor(COLORS.success)
            .setFooter({ text: "Obrigado por sua paciência!" })
            .setTimestamp();
        
        await interaction.editReply({ embeds: [successEmbed] });
    }

    // ==============================
    // MENU DE SELEÇÃO DE PRODUTOS DA LOJA
    // ==============================
    if (interaction.isStringSelectMenu() && interaction.customId === "loja_produtos") {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        if (!carrinhos[interaction.user.id]) {
            carrinhos[interaction.user.id] = { produtos: [], total: 0 };
        }

        carrinhos[interaction.user.id].produtos.push(produto);
        carrinhos[interaction.user.id].total += produto.preco;

        const addEmbed = new EmbedBuilder()
            .setTitle("Produto Adicionado ao Carrinho")
            .setImage(produto.foto)
            .setDescription(`**${produto.nome}**\n\n${produto.descricao}\n\n💰 R$ ${produto.preco.toFixed(2).replace('.', ',')}\n\n📊 Total do carrinho: R$ ${carrinhos[interaction.user.id].total.toFixed(2).replace('.', ',')}`)
            .setColor(COLORS.accent)
            .setFooter({ text: "Produto adicionado com sucesso!" })
            .setTimestamp();

        const verCarrinhoButton = new ButtonBuilder()
            .setCustomId('ver_carrinho')
            .setLabel('Ver Carrinho')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛒');

        const continuarButton = new ButtonBuilder()
            .setCustomId('continuar_comprando')
            .setLabel('Continuar Comprando')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🛍️');

        const row = new ActionRowBuilder().addComponents(verCarrinhoButton, continuarButton);

        await interaction.reply({ embeds: [addEmbed], components: [row], ephemeral: true });
    }

    // ==============================
    // BOTÕES PRINCIPAIS
    // ==============================
    if (interaction.isButton()) {

        // BOTÃO: Ver Carrinho
        if (interaction.customId === 'ver_carrinho') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Seu carrinho está vazio!", ephemeral: true });
            }

            let descricao = "**Produtos no Carrinho:**\n\n";
            carrinho.produtos.forEach((produto, index) => {
                descricao += `${index + 1}. ${produto.nome}\n   💰 R$ ${produto.preco.toFixed(2).replace('.', ',')}\n\n`;
            });
            descricao += `\n💰 **Total:** R$ ${carrinho.total.toFixed(2).replace('.', ',')}`;

            const carrinhoEmbed = new EmbedBuilder()
                .setTitle("Seu Carrinho")
                .setDescription(descricao)
                .setColor(COLORS.accent)
                .setFooter({ text: `${carrinho.produtos.length} item(ns)` })
                .setTimestamp();

            const pagarButton = new ButtonBuilder()
                .setCustomId('pagar_carrinho')
                .setLabel('Pagar com PIX')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💳');

            const limparButton = new ButtonBuilder()
                .setCustomId('limpar_carrinho')
                .setLabel('Limpar Carrinho')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️');

            const row = new ActionRowBuilder().addComponents(pagarButton, limparButton);

            await interaction.reply({ embeds: [carrinhoEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Continuar Comprando
        if (interaction.customId === 'continuar_comprando') {
            const produtosAtivos = Object.entries(produtos).filter(([_, p]) => p.ativo);
            
            if (produtosAtivos.length === 0) {
                return interaction.reply({ content: "❌ Nenhum produto disponível!", ephemeral: true });
            }

            const lojaEmbed = new EmbedBuilder()
                .setTitle("Catálogo - Arcanjo Store")
                .setDescription("Explore nossos produtos disponíveis")
                .setColor(COLORS.accent)
                .setFooter({ text: `${produtosAtivos.length} produtos disponíveis` })
                .setTimestamp();

            const options = produtosAtivos.map(([id, produto]) => ({
                label: produto.nome,
                description: `R$ ${produto.preco.toFixed(2).replace('.', ',')}`,
                value: id,
                emoji: "💎"
            }));

            const menu = new StringSelectMenuBuilder()
                .setCustomId("loja_produtos")
                .setPlaceholder("Selecione um Produto")
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ embeds: [lojaEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Pagar com PIX
        if (interaction.customId === 'pagar_carrinho') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Seu carrinho está vazio!", ephemeral: true });
            }

            let produtosTexto = "";
            carrinho.produtos.forEach((produto, index) => {
                produtosTexto += `${index + 1}. ${produto.nome} - R$ ${produto.preco.toFixed(2).replace('.', ',')}\n`;
            });

            const pixEmbed = new EmbedBuilder()
                .setTitle("Pagamento com PIX")
                .setDescription(`**Produtos:**\n${produtosTexto}\n**Total:** R$ ${carrinho.total.toFixed(2).replace('.', ',')}\n\n📱 Escaneie o QR Code abaixo ou use a chave PIX:\n\`${PIX_KEY}\`\n\n👤 Titular: ${PIX_OWNER_NAME}`)
                .setColor(COLORS.success)
                .setImage("https://via.placeholder.com/300?text=QR+CODE+PIX")
                .setFooter({ text: "Após realizar o pagamento, clique em confirmar" })
                .setTimestamp();

            const confirmarButton = new ButtonBuilder()
                .setCustomId('confirmar_pagamento')
                .setLabel('Confirmar Pagamento')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelarButton = new ButtonBuilder()
                .setCustomId('cancelar_pagamento')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('❌');

            const row = new ActionRowBuilder().addComponents(confirmarButton, cancelarButton);

            await interaction.reply({ embeds: [pixEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Limpar Carrinho
        if (interaction.customId === 'limpar_carrinho') {
            carrinhos[interaction.user.id] = { produtos: [], total: 0 };
            await interaction.reply({ content: "🗑️ Carrinho limpo!", ephemeral: true });
        }

        // BOTÃO: Confirmar Pagamento
        if (interaction.customId === 'confirmar_pagamento') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Seu carrinho está vazio!", ephemeral: true });
            }

            let produtosTexto = "";
            carrinho.produtos.forEach((produto) => {
                produtosTexto += `• ${produto.nome} - R$ ${produto.preco.toFixed(2).replace('.', ',')}\n`;
            });

            let carrinhoTexto = "";
            carrinho.produtos.forEach((produto) => {
                carrinhoTexto += `1x ${produto.nome}\n`;
            });

            // =====================================================
            // EMBED DE ENTREGA REALIZADA (ESTILO DA FOTO)
            // =====================================================
            const entregaEmbed = new EmbedBuilder()
                .setTitle("🔒 Entrega Realizada!")
                .setDescription(`O usuário ${interaction.user.username} teve seu pedido entregue.`)
                .setColor(COLORS.white) // Borda branca como na foto
                .addFields(
                    { 
                        name: "Carrinho", 
                        value: carrinhoTexto, 
                        inline: true 
                    },
                    { 
                        name: "Valor pago", 
                        value: `R$ ${carrinho.total.toFixed(2).replace('.', ',')}`, 
                        inline: true 
                    }
                )
                .setFooter({ text: `Arcanjo Store • ${new Date().toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` })
                .setTimestamp();

            // Botão de Feedbacks com ícone de troféu
            const feedbacksButton = new ButtonBuilder()
                .setCustomId(`feedbacks_pedido_${Date.now()}`)
                .setLabel('Feedbacks')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🏆');

            const feedbacksRow = new ActionRowBuilder().addComponents(feedbacksButton);

            // Enviar no canal de vendas/pedidos
            const salesChannel = interaction.guild.channels.cache.get(SALES_CHANNEL_ID);
            if (salesChannel) {
                await salesChannel.send({ embeds: [entregaEmbed], components: [feedbacksRow] });
            }

            // Mensagem de confirmação pro cliente
            const confirmEmbed = new EmbedBuilder()
                .setTitle("✅ Pagamento Confirmado!")
                .setDescription(`Obrigado pela compra! Seu pedido foi registrado.\n\n💰 Total: R$ ${carrinho.total.toFixed(2).replace('.', ',')}\n\nEm breve você receberá mais informações sobre sua compra.`)
                .setColor(COLORS.success)
                .setFooter({ text: "Obrigado por sua compra!" })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

            // Limpar carrinho
            carrinhos[interaction.user.id] = { produtos: [], total: 0 };
        }

        // BOTÃO: Cancelar Pagamento
        if (interaction.customId === 'cancelar_pagamento') {
            await interaction.reply({ content: "❌ Pagamento cancelado. Seu carrinho foi mantido.", ephemeral: true });
        }

        // ==============================
        // BOTÕES DE TICKET
        // ==============================

        // BOTÃO: Finalizar Ticket
        if (interaction.customId === 'finalize_ticket') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Acesso Negado")
                    .setDescription("Apenas membros da staff podem finalizar tickets.")
                    .setColor(COLORS.danger);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            await interaction.deferReply();
            
            // Gerar transcript
            const transcript = await gerarTranscript(interaction.channel);

            // Salvar transcript em arquivo
            const transcriptFileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
            const transcriptFilePath = path.join(__dirname, transcriptFileName);
            fs.writeFileSync(transcriptFilePath, transcript);

            // Enviar no canal de logs
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("📋 Ticket Finalizado")
                    .setDescription(`**Ticket:** ${interaction.channel.name}\n**Finalizado por:** ${interaction.user}\n**Data:** ${new Date().toLocaleString('pt-BR')}`)
                    .setColor(COLORS.success)
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed], files: [transcriptFilePath] });
            }

            const finalEmbed = new EmbedBuilder()
                .setTitle("✅ Ticket Finalizado")
                .setDescription("O ticket foi finalizado e o transcript foi salvo.")
                .setColor(COLORS.success);
            
            await interaction.editReply({ embeds: [finalEmbed] });
            setTimeout(() => {
                interaction.channel.delete();
                fs.unlinkSync(transcriptFilePath);
            }, 2000);
        }

        // BOTÃO: Assumir Ticket
        if (interaction.customId === 'assume_ticket') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Acesso Negado")
                    .setDescription("Apenas membros da staff podem assumir tickets.")
                    .setColor(COLORS.danger);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const assumeEmbed = new EmbedBuilder()
                .setTitle("🔧 Ticket Assumido")
                .setDescription(`${interaction.user} assumiu o ticket!`)
                .setColor(COLORS.info)
                .setTimestamp();
            
            await interaction.reply({ embeds: [assumeEmbed] });
        }

        // BOTÃO: Painel Staff
        if (interaction.customId === 'staff_panel') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("Acesso Negado")
                    .setDescription("Apenas membros da staff podem acessar o painel.")
                    .setColor(COLORS.danger);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            const panelEmbed = new EmbedBuilder()
                .setTitle("🛡️ Painel Staff")
                .setDescription("Painel de controle da equipe de suporte.\n\nAqui você pode gerenciar tickets e visualizar estatísticas.")
                .setColor(COLORS.info);
            
            await interaction.reply({ embeds: [panelEmbed], ephemeral: true });
        }

        // BOTÃO: Sair Ticket (com transcript)
        if (interaction.customId === 'leave_ticket') {
            await interaction.deferReply();
            
            // Gerar transcript
            const transcript = await gerarTranscript(interaction.channel);

            // Salvar transcript em arquivo
            const transcriptFileName = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
            const transcriptFilePath = path.join(__dirname, transcriptFileName);
            fs.writeFileSync(transcriptFilePath, transcript);

            // Enviar no canal de logs
            const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("📋 Ticket Fechado")
                    .setDescription(`**Ticket:** ${interaction.channel.name}\n**Fechado por:** ${interaction.user}\n**Data:** ${new Date().toLocaleString('pt-BR')}`)
                    .setColor(COLORS.info)
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed], files: [transcriptFilePath] });
            }

            const closeEmbed = new EmbedBuilder()
                .setTitle("🚪 Ticket Fechado")
                .setDescription("O ticket foi fechado e o transcript foi salvo.")
                .setColor(COLORS.info);
            
            await interaction.editReply({ embeds: [closeEmbed] });
            setTimeout(() => {
                interaction.channel.delete();
                fs.unlinkSync(transcriptFilePath);
            }, 2000);
        }
    }
});

// ============================================
// FUNÇÃO: GERAR TRANSCRIPT DO CANAL
// ============================================
async function gerarTranscript(canal) {
    let allMessages = [];
    let lastId = null;

    // Buscar todas as mensagens (paginando de 100 em 100)
    while (true) {
        const options = { limit: 100 };
        if (lastId) {
            options.before = lastId;
        }

        const messages = await canal.messages.fetch(options);
        allMessages.push(...messages.values());

        if (messages.size < 100) break;
        lastId = messages.last().id;
    }

    // Ordenar por data (mais antiga primeiro)
    allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    // Montar transcript
    let transcript = "";
    transcript += "═══════════════════════════════════════════════════════════════\n";
    transcript += `  TRANSCRIPT DO TICKET: #${canal.name}\n`;
    transcript += `  Canal ID: ${canal.id}\n`;
    transcript += `  Data: ${new Date().toLocaleString('pt-BR')}\n`;
    transcript += "═══════════════════════════════════════════════════════════════\n\n";

    // Cabeçalho da tabela
    transcript += "DATA/HORA              | USUÁRIO              | CONTEÚDO\n";
    transcript += "-----------------------|-----------------------|─────────────────────────────────────────\n";

    for (const msg of allMessages) {
        const data = msg.createdAt.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const autor = msg.author.tag || "Sistema";
        const conteudo = msg.content || "[Sem conteúdo]";
        
        // Adicionar referências de anexos
        let anexoInfo = "";
        if (msg.attachments.size > 0) {
            anexoInfo = ` [${msg.attachments.size} anexo(s)]`;
        }

        transcript += `${data} | ${autor.padEnd(21)} | ${conteudo.substring(0, 80)}${anexoInfo}\n`;
    }

    transcript += `\n═══════════════════════════════════════════════════════════════\n`;
    transcript += `  Total de mensagens: ${allMessages.length}\n`;
    transcript += `  Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    transcript += "═══════════════════════════════════════════════════════════════\n";

    return transcript;
}

// ============================================
// LOGIN DO BOT
// ============================================
client.login(TOKEN);

// ============================================
// SERVIDOR DE MONITORAMENTO (RENDER)
// ============================================
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("🤖 Bot Online e Operacional");
}).listen(PORT, () => {
    console.log(`✅ Servidor de monitoramento rodando na porta ${PORT}`);
});
