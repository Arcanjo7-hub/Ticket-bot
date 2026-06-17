const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
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
const SALES_CHANNEL_ID = "1516106012560461864";

// Dados de vendas
let produtos = {
    "produto1": { 
        nome: "Produto 1", 
        preco: 50.00, 
        descricao: "Descrição do Produto 1",
        foto: "https://via.placeholder.com/400x300?text=Produto+1",
        ativo: true
    },
    "produto2": { 
        nome: "Produto 2", 
        preco: 100.00, 
        descricao: "Descrição do Produto 2",
        foto: "https://via.placeholder.com/400x300?text=Produto+2",
        ativo: true
    }
};

let carrinhos = {};

const PIX_KEY = "sua_chave_pix_aqui";
const PIX_OWNER_NAME = "Arcanjo Store";

client.once("ready", async () => {
    console.log(`✅ Logado como ${client.user.tag}`);
    
    try {
        await client.application.commands.set([
            { name: 'painel', description: '📋 Cria o painel de tickets' },
            { name: 'loja', description: '🛍️ Abre a loja de vendas' },
            { name: 'criar_produto', description: '➕ Criar um novo produto' },
            { name: 'editar_produto', description: '✏️ Editar um produto' },
            { name: 'listar_produtos', description: '📊 Listar produtos' },
            { name: 'deletar_produto', description: '🗑️ Deletar um produto' }
        ]);
        console.log("✅ Comandos registrados!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    try {
        // COMANDO /PAINEL
        if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
            const embed = new EmbedBuilder()
                .setTitle("Central de Suporte")
                .setDescription("Clique abaixo para abrir um ticket")
                .setColor("#d4af37");

            const menu = new StringSelectMenuBuilder()
                .setCustomId("ticket")
                .setPlaceholder("Selecione uma opção...")
                .addOptions([
                    { label: "Suporte", value: "suporte", emoji: "🎧" },
                    { label: "Receber produto", value: "produto", emoji: "📦" }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ embeds: [embed], components: [row] });
        }

        // COMANDO /LOJA
        if (interaction.isChatInputCommand() && interaction.commandName === "loja") {
            const produtosAtivos = Object.entries(produtos).filter(([_, p]) => p.ativo);
            
            if (produtosAtivos.length === 0) {
                return interaction.reply({ content: "❌ Nenhum produto disponível!", ephemeral: true });
            }

            const lojaEmbed = new EmbedBuilder()
                .setTitle("🛍️ Loja")
                .setDescription("Escolha um produto")
                .setColor("#0099ff");

            const options = produtosAtivos.map(([id, produto]) => ({
                label: produto.nome,
                description: `R$ ${produto.preco.toFixed(2)}`,
                value: id,
                emoji: "💎"
            }));

            const menu = new StringSelectMenuBuilder()
                .setCustomId("loja_produtos")
                .setPlaceholder("Selecione um produto...")
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ embeds: [lojaEmbed], components: [row] });
        }

        // COMANDO /CRIAR_PRODUTO
        if (interaction.isChatInputCommand() && interaction.commandName === "criar_produto") {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                return interaction.reply({ content: "❌ Apenas staff!", ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId('modal_criar_produto')
                .setTitle('Criar Produto');

            const nomeInput = new TextInputBuilder()
                .setCustomId('produto_nome')
                .setLabel('Nome')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const precoInput = new TextInputBuilder()
                .setCustomId('produto_preco')
                .setLabel('Preço')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const descricaoInput = new TextInputBuilder()
                .setCustomId('produto_descricao')
                .setLabel('Descrição')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            const fotoInput = new TextInputBuilder()
                .setCustomId('produto_foto')
                .setLabel('URL da Foto')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(nomeInput),
                new ActionRowBuilder().addComponents(precoInput),
                new ActionRowBuilder().addComponents(descricaoInput),
                new ActionRowBuilder().addComponents(fotoInput)
            );

            await interaction.showModal(modal);
        }

        // COMANDO /EDITAR_PRODUTO
        if (interaction.isChatInputCommand() && interaction.commandName === "editar_produto") {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                return interaction.reply({ content: "❌ Apenas staff!", ephemeral: true });
            }

            const options = Object.entries(produtos).map(([id, produto]) => ({
                label: produto.nome,
                description: `R$ ${produto.preco.toFixed(2)}`,
                value: id,
                emoji: "✏️"
            }));

            if (options.length === 0) {
                return interaction.reply({ content: "❌ Nenhum produto!", ephemeral: true });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_editar_produto')
                .setPlaceholder('Selecione um produto...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ components: [row], ephemeral: true });
        }

        // COMANDO /LISTAR_PRODUTOS
        if (interaction.isChatInputCommand() && interaction.commandName === "listar_produtos") {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                return interaction.reply({ content: "❌ Apenas staff!", ephemeral: true });
            }

            if (Object.keys(produtos).length === 0) {
                return interaction.reply({ content: "❌ Nenhum produto!", ephemeral: true });
            }

            let descricao = "";
            Object.entries(produtos).forEach(([id, produto], index) => {
                const status = produto.ativo ? "✅" : "❌";
                descricao += `${index + 1}. ${status} **${produto.nome}** - R$ ${produto.preco.toFixed(2)}\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle("📊 Produtos")
                .setDescription(descricao)
                .setColor("#d4af37");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // COMANDO /DELETAR_PRODUTO
        if (interaction.isChatInputCommand() && interaction.commandName === "deletar_produto") {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                return interaction.reply({ content: "❌ Apenas staff!", ephemeral: true });
            }

            const options = Object.entries(produtos).map(([id, produto]) => ({
                label: produto.nome,
                value: id,
                emoji: "🗑️"
            }));

            if (options.length === 0) {
                return interaction.reply({ content: "❌ Nenhum produto!", ephemeral: true });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId('menu_deletar_produto')
                .setPlaceholder('Selecione um produto...')
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ components: [row], ephemeral: true });
        }

        // MODAL: Criar Produto
        if (interaction.isModalSubmit() && interaction.customId === 'modal_criar_produto') {
            const nome = interaction.fields.getTextInputValue('produto_nome');
            const preco = parseFloat(interaction.fields.getTextInputValue('produto_preco'));
            const descricao = interaction.fields.getTextInputValue('produto_descricao');
            const foto = interaction.fields.getTextInputValue('produto_foto');

            if (isNaN(preco) || preco <= 0) {
                return interaction.reply({ content: "❌ Preço inválido!", ephemeral: true });
            }

            const id = `produto_${Date.now()}`;
            produtos[id] = { nome, preco, descricao, foto, ativo: true };

            const embed = new EmbedBuilder()
                .setTitle("✅ Produto Criado!")
                .setImage(foto)
                .setDescription(`**${nome}**\nR$ ${preco.toFixed(2)}\n${descricao}`)
                .setColor("#00ff00");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // MENU: Editar Produto
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_editar_produto') {
            const produtoId = interaction.values[0];
            const produto = produtos[produtoId];

            const modal = new ModalBuilder()
                .setCustomId(`modal_editar_${produtoId}`)
                .setTitle(`Editar: ${produto.nome}`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('produto_nome')
                        .setLabel('Nome')
                        .setStyle(TextInputStyle.Short)
                        .setValue(produto.nome)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('produto_preco')
                        .setLabel('Preço')
                        .setStyle(TextInputStyle.Short)
                        .setValue(produto.preco.toString())
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('produto_descricao')
                        .setLabel('Descrição')
                        .setStyle(TextInputStyle.Paragraph)
                        .setValue(produto.descricao)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('produto_foto')
                        .setLabel('URL da Foto')
                        .setStyle(TextInputStyle.Short)
                        .setValue(produto.foto)
                        .setRequired(true)
                )
            );

            await interaction.showModal(modal);
        }

        // MODAL: Editar Produto
        if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_editar_')) {
            const produtoId = interaction.customId.replace('modal_editar_', '');
            const nome = interaction.fields.getTextInputValue('produto_nome');
            const preco = parseFloat(interaction.fields.getTextInputValue('produto_preco'));
            const descricao = interaction.fields.getTextInputValue('produto_descricao');
            const foto = interaction.fields.getTextInputValue('produto_foto');

            if (isNaN(preco) || preco <= 0) {
                return interaction.reply({ content: "❌ Preço inválido!", ephemeral: true });
            }

            produtos[produtoId] = { nome, preco, descricao, foto, ativo: produtos[produtoId].ativo };

            const embed = new EmbedBuilder()
                .setTitle("✅ Produto Atualizado!")
                .setImage(foto)
                .setDescription(`**${nome}**\nR$ ${preco.toFixed(2)}\n${descricao}`)
                .setColor("#00ff00");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // MENU: Deletar Produto
        if (interaction.isStringSelectMenu() && interaction.customId === 'menu_deletar_produto') {
            const produtoId = interaction.values[0];
            const produto = produtos[produtoId];

            const confirmButton = new ButtonBuilder()
                .setCustomId(`confirmar_deletar_${produtoId}`)
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️');

            const cancelButton = new ButtonBuilder()
                .setCustomId('cancelar_deletar')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            const embed = new EmbedBuilder()
                .setTitle("⚠️ Confirmar Deleção")
                .setImage(produto.foto)
                .setDescription(`Deletar **${produto.nome}**?`)
                .setColor("#ff0000");

            await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
        }

        // BOTÃO: Confirmar Deletar
        if (interaction.isButton() && interaction.customId.startsWith('confirmar_deletar_')) {
            const produtoId = interaction.customId.replace('confirmar_deletar_', '');
            const produto = produtos[produtoId];

            delete produtos[produtoId];

            const embed = new EmbedBuilder()
                .setTitle("✅ Deletado!")
                .setDescription(`**${produto.nome}** foi removido!`)
                .setColor("#00ff00");

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (interaction.isButton() && interaction.customId === 'cancelar_deletar') {
            await interaction.reply({ content: "❌ Cancelado!", ephemeral: true });
        }

        // MENU: Seleção de Tickets
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

            const welcomeEmbed = new EmbedBuilder()
                .setTitle("TICKET SUPORTE")
                .setDescription("Bem-vindo! A equipe em breve responderá.")
                .setColor("#00ff00");

            const finalizeButton = new ButtonBuilder()
                .setCustomId('finalize_ticket')
                .setLabel('Finalizar')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const leaveButton = new ButtonBuilder()
                .setCustomId('leave_ticket')
                .setLabel('Sair')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🚪');

            const row = new ActionRowBuilder().addComponents(finalizeButton, leaveButton);

            await canal.send({ embeds: [welcomeEmbed], components: [row] });
            
            const successEmbed = new EmbedBuilder()
                .setTitle("✅ Ticket Criado!")
                .setDescription(`Acesse: ${canal}`)
                .setColor("#00ff00");
            
            await interaction.editReply({ embeds: [successEmbed] });
        }

        // MENU: Loja Produtos
        if (interaction.isStringSelectMenu() && interaction.customId === "loja_produtos") {
            const produtoId = interaction.values[0];
            const produto = produtos[produtoId];

            if (!carrinhos[interaction.user.id]) {
                carrinhos[interaction.user.id] = { produtos: [], total: 0 };
            }

            carrinhos[interaction.user.id].produtos.push(produto);
            carrinhos[interaction.user.id].total += produto.preco;

            const addEmbed = new EmbedBuilder()
                .setTitle("✅ Adicionado!")
                .setImage(produto.foto)
                .setDescription(`**${produto.nome}**\nR$ ${produto.preco.toFixed(2)}\n\nTotal: R$ ${carrinhos[interaction.user.id].total.toFixed(2)}`)
                .setColor("#00ff00");

            const verCarrinhoButton = new ButtonBuilder()
                .setCustomId('ver_carrinho')
                .setLabel('Ver Carrinho')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🛒');

            const continuarButton = new ButtonBuilder()
                .setCustomId('continuar_comprando')
                .setLabel('Continuar')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(verCarrinhoButton, continuarButton);

            await interaction.reply({ embeds: [addEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Ver Carrinho
        if (interaction.isButton() && interaction.customId === 'ver_carrinho') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Carrinho vazio!", ephemeral: true });
            }

            let descricao = "";
            carrinho.produtos.forEach((produto, index) => {
                descricao += `${index + 1}. ${produto.nome} - R$ ${produto.preco.toFixed(2)}\n`;
            });
            descricao += `\nTotal: R$ ${carrinho.total.toFixed(2)}`;

            const carrinhoEmbed = new EmbedBuilder()
                .setTitle("🛒 Carrinho")
                .setDescription(descricao)
                .setColor("#0099ff");

            const pagarButton = new ButtonBuilder()
                .setCustomId('pagar_carrinho')
                .setLabel('Pagar com PIX')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💳');

            const limparButton = new ButtonBuilder()
                .setCustomId('limpar_carrinho')
                .setLabel('Limpar')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(pagarButton, limparButton);

            await interaction.reply({ embeds: [carrinhoEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Continuar Comprando
        if (interaction.isButton() && interaction.customId === 'continuar_comprando') {
            const produtosAtivos = Object.entries(produtos).filter(([_, p]) => p.ativo);
            
            if (produtosAtivos.length === 0) {
                return interaction.reply({ content: "Nenhum produto!", ephemeral: true });
            }

            const options = produtosAtivos.map(([id, produto]) => ({
                label: produto.nome,
                description: `R$ ${produto.preco.toFixed(2)}`,
                value: id,
                emoji: "💎"
            }));

            const menu = new StringSelectMenuBuilder()
                .setCustomId("loja_produtos")
                .setPlaceholder("Selecione...")
                .addOptions(options);

            const row = new ActionRowBuilder().addComponents(menu);
            await interaction.reply({ components: [row], ephemeral: true });
        }

        // BOTÃO: Pagar
        if (interaction.isButton() && interaction.customId === 'pagar_carrinho') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Carrinho vazio!", ephemeral: true });
            }

            let produtosTexto = "";
            carrinho.produtos.forEach((produto, index) => {
                produtosTexto += `${index + 1}. ${produto.nome}\n`;
            });

            const pixEmbed = new EmbedBuilder()
                .setTitle("💳 PIX")
                .setDescription(`${produtosTexto}\nTotal: R$ ${carrinho.total.toFixed(2)}\n\nChave: ${PIX_KEY}\nTitular: ${PIX_OWNER_NAME}`)
                .setColor("#00ff00");

            const confirmarButton = new ButtonBuilder()
                .setCustomId('confirmar_pagamento')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅');

            const cancelarButton = new ButtonBuilder()
                .setCustomId('cancelar_pagamento')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(confirmarButton, cancelarButton);

            await interaction.reply({ embeds: [pixEmbed], components: [row], ephemeral: true });
        }

        // BOTÃO: Limpar Carrinho
        if (interaction.isButton() && interaction.customId === 'limpar_carrinho') {
            carrinhos[interaction.user.id] = { produtos: [], total: 0 };
            await interaction.reply({ content: "Carrinho limpo!", ephemeral: true });
        }

        // BOTÃO: Confirmar Pagamento
        if (interaction.isButton() && interaction.customId === 'confirmar_pagamento') {
            const carrinho = carrinhos[interaction.user.id];
            if (!carrinho || carrinho.produtos.length === 0) {
                return interaction.reply({ content: "Carrinho vazio!", ephemeral: true });
            }

            let produtosTexto = "";
            carrinho.produtos.forEach((produto) => {
                produtosTexto += `• ${produto.nome} - R$ ${produto.preco.toFixed(2)}\n`;
            });

            const vendaEmbed = new EmbedBuilder()
                .setTitle("💰 VENDA!")
                .setDescription(`Cliente: ${interaction.user}\n\n${produtosTexto}\nTotal: R$ ${carrinho.total.toFixed(2)}`)
                .setColor("#00ff00")
                .setTimestamp();

            const salesChannel = interaction.guild.channels.cache.get(SALES_CHANNEL_ID);
            if (salesChannel) {
                await salesChannel.send({ embeds: [vendaEmbed] });
            }

            const confirmEmbed = new EmbedBuilder()
                .setTitle("✅ Pagamento Confirmado!")
                .setDescription(`Total: R$ ${carrinho.total.toFixed(2)}`)
                .setColor("#00ff00");

            await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });

            carrinhos[interaction.user.id] = { produtos: [], total: 0 };
        }

        // BOTÃO: Cancelar Pagamento
        if (interaction.isButton() && interaction.customId === 'cancelar_pagamento') {
            await interaction.reply({ content: "Cancelado!", ephemeral: true });
        }

        // BOTÃO: Finalizar Ticket
        if (interaction.isButton() && interaction.customId === 'finalize_ticket') {
            const isStaff = STAFF_ROLE_IDS.some(roleId => interaction.member.roles.cache.has(roleId));
            if (!isStaff) {
                return interaction.reply({ content: "Apenas staff!", ephemeral: true });
            }

            await interaction.deferReply();
            setTimeout(() => interaction.channel.delete(), 1000);
        }

        // BOTÃO: Sair Ticket
        if (interaction.isButton() && interaction.customId === 'leave_ticket') {
            await interaction.deferReply();
            setTimeout(() => interaction.channel.delete(), 1000);
        }

    } catch (error) {
        console.error("Erro na interação:", error);
        if (!interaction.replied) {
            await interaction.reply({ content: "Erro ao processar interação!", ephemeral: true }).catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);

const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Bot Online");
}).listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
