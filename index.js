const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, Events, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const http = require("http");
const fs = require("fs");
const config = require("./config.json");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages] });

// Cores Premium
const COLORS = {
    primary: "#1a1a2e",      // Preto sofisticado
    accent: "#d4af37",       // Ouro
    success: "#00d084",      // Verde premium
    danger: "#ff6b6b",       // Vermelho sofisticado
    info: "#4a90e2"          // Azul premium
};

// Dados de vendas (manter aqui ou mover para um JSON separado se for dinâmico)
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

let carrinhos = {}; // Para gerenciar carrinhos de compra e tickets temporariamente

client.once("ready", async () => {
    console.log(`✅ Logado como ${client.user.tag}`);
    
    try {
        await client.application.commands.set([
            { name: 'painel', description: '📋 Cria o painel de tickets' },
            { name: 'loja', description: '🛍️ Abre a loja de vendas' },
            { name: 'criar_produto', description: '➕ Criar um novo produto' },
            { name: 'editar_produto', description: '✏️ Editar um produto existente' },
            { name: 'listar_produtos', description: '📊 Listar todos os produtos' },
            { name: 'deletar_produto', description: '🗑️ Deletar um produto' },
            { 
                name: 'fechar_ticket', 
                description: '🔒 Fecha um ticket de suporte', 
                options: [
                    { 
                        name: 'canal', 
                        type: 7, // ChannelType.GuildText
                        description: 'O canal do ticket a ser fechado', 
                        required: true 
                    }
                ]
            }
        ]);
        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }

    try {
        const panelChannel = await client.channels.fetch(config.panelChannelId);
        if (panelChannel) {
            const messages = await panelChannel.messages.fetch({ limit: 10 });
            for (const message of messages.values()) {
                if (message.author.id === client.user.id) {
                    await message.delete().catch(() => {});
                }
            }

            const embed = new EmbedBuilder()
                .setTitle("✨ Central de Suporte - Arcanjo ✨")
                .setDescription("Bem-vindo à nossa central de suporte premium.\n\nAguarde que um membro da nossa equipe responda sua solicitação em breve. O atendimento é realizado de forma privada e exclusiva.")
                .setColor(COLORS.accent)
                .setImage(config.panelImageUrl)
                .setFooter({ text: "Clique em uma opção abaixo para começar", iconURL: client.user.avatarURL() })
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

client.on(Events.InteractionCreate, async interaction => {
    // COMANDO /PAINEL
    if (interaction.isChatInputCommand() && interaction.commandName === "painel") {
        const embed = new EmbedBuilder()
            .setTitle("✨ Central de Suporte - Arcanjo ✨")
            .setDescription("Bem-vindo à nossa central de suporte premium.\n\nAguarde que um membro da nossa equipe responda sua solicitação em breve. O atendimento é realizado de forma privada e exclusiva.")
            .setColor(COLORS.accent)
            .setImage(config.panelImageUrl)
            .setFooter({ text: "Clique em uma opção abaixo para começar", iconURL: client.user.avatarURL() })
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

    // COMANDO /LOJA
    if (interaction.isChatInputCommand() && interaction.commandName === "loja") {
        const produtosAtivos = Object.entries(produtos).filter(([_, p]) => p.ativo);
        
        if (produtosAtivos.length === 0) {
            return interaction.reply({ content: "❌ Nenhum produto disponível no momento!", ephemeral: true });
        }

        const lojaEmbed = new EmbedBuilder()
            .setTitle("✨ Catálogo Premium - Arcanjo Store ✨")
            .setDescription("Explore nossa coleção exclusiva de produtos premium")
            .setColor(COLORS.accent)
            .setFooter({ text: `${produtosAtivos.length} produtos disponíveis`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        const options = produtosAtivos.map(([id, produto]) => ({
            label: produto.nome,
            description: `R$ ${produto.preco.toFixed(2).replace(".", ",")}`,
            value: id,
            emoji: "💎"
        }));

        const menu = new StringSelectMenuBuilder()
            .setCustomId("loja_produtos")
            .setPlaceholder("Selecione um produto para visualizar...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ embeds: [lojaEmbed], components: [row] });
    }

    // COMANDO /CRIAR_PRODUTO
    if (interaction.isChatInputCommand() && interaction.commandName === "criar_produto") {
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode criar produtos!", ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId("modal_criar_produto")
            .setTitle("Criar Novo Produto");

        const nomeInput = new TextInputBuilder()
            .setCustomId("produto_nome")
            .setLabel("Nome do Produto")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: Produto Premium")
            .setRequired(true);

        const precoInput = new TextInputBuilder()
            .setCustomId("produto_preco")
            .setLabel("Preço (R$)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Ex: 99.99")
            .setRequired(true);

        const descricaoInput = new TextInputBuilder()
            .setCustomId("produto_descricao")
            .setLabel("Descrição")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder("Descreva o produto...")
            .setRequired(true);

        const fotoInput = new TextInputBuilder()
            .setCustomId("produto_foto")
            .setLabel("URL da Foto")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("https://exemplo.com/foto.jpg")
            .setRequired(true);

        const row1 = new ActionRowBuilder().addComponents(nomeInput);
        const row2 = new ActionRowBuilder().addComponents(precoInput);
        const row3 = new ActionRowBuilder().addComponents(descricaoInput);
        const row4 = new ActionRowBuilder().addComponents(fotoInput);

        modal.addComponents(row1, row2, row3, row4);
        await interaction.showModal(modal);
    }

    // COMANDO /EDITAR_PRODUTO
    if (interaction.isChatInputCommand() && interaction.commandName === "editar_produto") {
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
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
            .setCustomId("menu_editar_produto")
            .setPlaceholder("Selecione um produto para editar...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ components: [row], ephemeral: true });
    }

    // COMANDO /LISTAR_PRODUTOS
    if (interaction.isChatInputCommand() && interaction.commandName === "listar_produtos") {
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
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
            descricao += `   💰 R$ ${produto.preco.toFixed(2).replace(".", ",")}\n`;
            descricao += `   📝 ${produto.descricao}\n`;
            descricao += `   🆔 \`${id}\`\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("✨ Produtos Cadastrados ✨")
            .setDescription(descricao)
            .setColor(COLORS.accent)
            .setFooter({ text: `Total: ${Object.keys(produtos).length} produtos`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // COMANDO /DELETAR_PRODUTO
    if (interaction.isChatInputCommand() && interaction.commandName === "deletar_produto") {
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
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
            .setCustomId("menu_deletar_produto")
            .setPlaceholder("Selecione um produto para deletar...")
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);
        await interaction.reply({ components: [row], ephemeral: true });
    }

    // MODAL: Criar Produto
    if (interaction.isModalSubmit() && interaction.customId === "modal_criar_produto") {
        const nome = interaction.fields.getTextInputValue("produto_nome");
        const preco = parseFloat(interaction.fields.getTextInputValue("produto_preco"));
        const descricao = interaction.fields.getTextInputValue("produto_descricao");
        const foto = interaction.fields.getTextInputValue("produto_foto");

        if (isNaN(preco) || preco <= 0) {
            return interaction.reply({ content: "❌ Preço inválido! Use um número positivo.", ephemeral: true });
        }

        const id = `produto_${Date.now()}`;
        produtos[id] = { nome, preco, descricao, foto, ativo: true };

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Criado com Sucesso!")
            .setImage(foto)
            .setDescription(`**${nome}**\n\n💰 R$ ${preco.toFixed(2).replace(".", ",")}\n\n📝 ${descricao}`)
            .setColor(COLORS.success)
            .setFooter({ text: `ID: ${id}`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // MENU: Editar Produto
    if (interaction.isStringSelectMenu() && interaction.customId === "menu_editar_produto") {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        const modal = new ModalBuilder()
            .setCustomId(`modal_editar_${produtoId}`)
            .setTitle(`Editar: ${produto.nome}`);

        const nomeInput = new TextInputBuilder()
            .setCustomId("edit_produto_nome")
            .setLabel("Nome do Produto")
            .setStyle(TextInputStyle.Short)
            .setValue(produto.nome)
            .setRequired(true);

        const precoInput = new TextInputBuilder()
            .setCustomId("edit_produto_preco")
            .setLabel("Preço (R$)")
            .setStyle(TextInputStyle.Short)
            .setValue(produto.preco.toString())
            .setRequired(true);

        const descricaoInput = new TextInputBuilder()
            .setCustomId("edit_produto_descricao")
            .setLabel("Descrição")
            .setStyle(TextInputStyle.Paragraph)
            .setValue(produto.descricao)
            .setRequired(true);

        const fotoInput = new TextInputBuilder()
            .setCustomId("edit_produto_foto")
            .setLabel("URL da Foto")
            .setStyle(TextInputStyle.Short)
            .setValue(produto.foto)
            .setRequired(true);

        const ativoInput = new TextInputBuilder()
            .setCustomId("edit_produto_ativo")
            .setLabel("Ativo (true/false)")
            .setStyle(TextInputStyle.Short)
            .setValue(produto.ativo.toString())
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nomeInput),
            new ActionRowBuilder().addComponents(precoInput),
            new ActionRowBuilder().addComponents(descricaoInput),
            new ActionRowBuilder().addComponents(fotoInput),
            new ActionRowBuilder().addComponents(ativoInput)
        );

        await interaction.showModal(modal);
    }

    // MODAL: Submissão de Edição de Produto
    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_editar_")) {
        const produtoId = interaction.customId.replace("modal_editar_", "");
        const produto = produtos[produtoId];

        if (!produto) {
            return interaction.reply({ content: "❌ Produto não encontrado!", ephemeral: true });
        }

        produto.nome = interaction.fields.getTextInputValue("edit_produto_nome");
        const novoPreco = parseFloat(interaction.fields.getTextInputValue("edit_produto_preco"));
        if (isNaN(novoPreco) || novoPreco <= 0) {
            return interaction.reply({ content: "❌ Preço inválido! Use um número positivo.", ephemeral: true });
        }
        produto.preco = novoPreco;
        produto.descricao = interaction.fields.getTextInputValue("edit_produto_descricao");
        produto.foto = interaction.fields.getTextInputValue("edit_produto_foto");
        produto.ativo = interaction.fields.getTextInputValue("edit_produto_ativo").toLowerCase() === "true";

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Editado com Sucesso!")
            .setImage(produto.foto)
            .setDescription(`**${produto.nome}**\n\n💰 R$ ${produto.preco.toFixed(2).replace(".", ",")}\n\n📝 ${produto.descricao}\n\nStatus: ${produto.ativo ? "Ativo" : "Inativo"}`)
            .setColor(COLORS.success)
            .setFooter({ text: `ID: ${produtoId}`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // MENU: Deletar Produto
    if (interaction.isStringSelectMenu() && interaction.customId === "menu_deletar_produto") {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        if (!produto) {
            return interaction.reply({ content: "❌ Produto não encontrado!", ephemeral: true });
        }

        delete produtos[produtoId];

        const embed = new EmbedBuilder()
            .setTitle("✅ Produto Deletado com Sucesso!")
            .setDescription(`O produto **${produto.nome}** (ID: 
` + "`" + produtoId + "`" + `) foi removido.`) 
            .setColor(COLORS.danger)
            .setFooter({ text: "Produtos restantes: " + Object.keys(produtos).length, iconURL: client.user.avatarURL() })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // MENU: Seleção de Produto na Loja
    if (interaction.isStringSelectMenu() && interaction.customId === "loja_produtos") {
        const produtoId = interaction.values[0];
        const produto = produtos[produtoId];

        if (!produto || !produto.ativo) {
            return interaction.reply({ content: "❌ Produto não encontrado ou inativo!", ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(produto.nome)
            .setDescription(produto.descricao)
            .setImage(produto.foto)
            .addFields(
                { name: "Preço", value: `R$ ${produto.preco.toFixed(2).replace(".", ",")}`, inline: true },
                { name: "Disponibilidade", value: produto.ativo ? "✅ Em Estoque" : "❌ Indisponível", inline: true }
            )
            .setColor(COLORS.info)
            .setFooter({ text: `ID: ${produtoId}`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        const buyButton = new ButtonBuilder()
            .setCustomId(`comprar_${produtoId}`)
            .setLabel("Comprar")
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(buyButton);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    // BOTÃO: Comprar Produto
    if (interaction.isButton() && interaction.customId.startsWith("comprar_")) {
        const produtoId = interaction.customId.replace("comprar_", "");
        const produto = produtos[produtoId];

        if (!produto || !produto.ativo) {
            return interaction.reply({ content: "❌ Produto não encontrado ou indisponível!", ephemeral: true });
        }

        // Gerar ID do carrinho
        const carrinhoId = `carrinho_${interaction.user.id}_${Date.now()}`;
        carrinhos[carrinhoId] = { 
            userId: interaction.user.id, 
            produtoId: produtoId, 
            quantidade: 1, 
            status: "pendente",
            valorTotal: produto.preco
        };

        const pixEmbed = new EmbedBuilder()
            .setTitle("🛒 Finalizar Compra - Pagamento PIX")
            .setDescription(`**Produto:** ${produto.nome}\n**Valor:** R$ ${produto.preco.toFixed(2).replace(".", ",")}\n\nPara finalizar a compra, realize o pagamento via PIX para a chave abaixo.`) 
            .addFields(
                { name: "Chave PIX", value: `
` + "`" + config.pixKey + "`" + ` (Copia e Cola)`, inline: false },
                { name: "Nome do Recebedor", value: config.pixOwnerName, inline: false }
            )
            .setColor(COLORS.primary)
            .setFooter({ text: `ID do Carrinho: ${carrinhoId} | Após o pagamento, aguarde a confirmação.`, iconURL: client.user.avatarURL() })
            .setTimestamp();

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirmar_pagamento_${carrinhoId}`)
            .setLabel("Já Paguei!")
            .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancelar_compra_${carrinhoId}`)
            .setLabel("Cancelar")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        await interaction.reply({ embeds: [pixEmbed], components: [row], ephemeral: true });
    }

    // BOTÃO: Confirmar Pagamento
    if (interaction.isButton() && interaction.customId.startsWith("confirmar_pagamento_")) {
        const carrinhoId = interaction.customId.replace("confirmar_pagamento_", "");
        const carrinho = carrinhos[carrinhoId];

        if (!carrinho || carrinho.userId !== interaction.user.id || carrinho.status !== "pendente") {
            return interaction.reply({ content: "❌ Compra não encontrada ou já processada!", ephemeral: true });
        }

        // Lógica para verificar o pagamento (simulada)
        carrinho.status = "confirmado";
        const produto = produtos[carrinho.produtoId];

        const deliveryEmbed = new EmbedBuilder()
            .setTitle("✅ Pagamento Confirmado e Produto Entregue!")
            .setDescription(`Obrigado por sua compra de **${produto.nome}**!\n\nSeu item foi entregue abaixo:\n\n` + "```\nSEU_ITEM_DO_ESTOQUE_AQUI\n```")
            .setColor(COLORS.success)
            .setFooter({ text: "Se precisar de suporte, use o painel de tickets.", iconURL: client.user.avatarURL() })
            .setTimestamp();

        try {
            await interaction.user.send({ embeds: [deliveryEmbed] });
            await interaction.update({ content: "✅ Pagamento confirmado! Seu produto foi entregue via DM. Verifique suas mensagens diretas.", components: [], embeds: [] });
            // Logar a venda
            const logChannel = await client.channels.fetch(config.logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle("💰 Nova Venda Realizada!")
                    .setDescription(`**Comprador:** ${interaction.user.tag} (${interaction.user.id})\n**Produto:** ${produto.nome} (ID: 
` + "`" + carrinho.produtoId + "`" + `)\n**Valor:** R$ ${carrinho.valorTotal.toFixed(2).replace(".", ",")}\n**Status:** Entregue`) 
                    .setColor(COLORS.success)
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }
        } catch (error) {
            console.error("Erro ao entregar produto ou enviar DM:", error);
            await interaction.update({ content: "❌ Pagamento confirmado, mas não foi possível entregar o produto via DM. Por favor, entre em contato com o suporte.", components: [], embeds: [] });
        }
    }

    // BOTÃO: Cancelar Compra
    if (interaction.isButton() && interaction.customId.startsWith("cancelar_compra_")) {
        const carrinhoId = interaction.customId.replace("cancelar_compra_", "");
        const carrinho = carrinhos[carrinhoId];

        if (!carrinho || carrinho.userId !== interaction.user.id || carrinho.status !== "pendente") {
            return interaction.reply({ content: "❌ Compra não encontrada ou já processada!", ephemeral: true });
        }

        carrinho.status = "cancelado";
        await interaction.update({ content: "❌ Compra cancelada com sucesso.", components: [], embeds: [] });
    }

    // MENU: Seleção de Ticket (Suporte ou Receber Produto)
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket") {
        const tipoTicket = interaction.values[0];

        const existingTicket = Object.values(carrinhos).find(t => t.userId === interaction.user.id && t.status === "open");
        if (existingTicket) {
            return interaction.reply({ content: `Você já tem um ticket aberto! Por favor, finalize o ticket existente em <#${existingTicket.channelId}> antes de abrir um novo.`, ephemeral: true });
        }

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}-${tipoTicket}`,
            type: ChannelType.GuildText,
            parent: config.ticketCategoryId, 
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: config.ownerRoleId, 
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: config.auxiliarRoleId, 
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: config.donoRoleId, 
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
            ],
        });

        // Salvar o ticket (simulado, idealmente em um DB)
        carrinhos[`ticket_${ticketChannel.id}`] = { 
            userId: interaction.user.id, 
            channelId: ticketChannel.id, 
            type: tipoTicket, 
            status: "open", 
            createdAt: new Date() 
        };

        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 Novo Ticket de ${tipoTicket === "suporte" ? "Suporte" : "Recebimento de Produto"}`)
            .setDescription(`Bem-vindo ao seu canal de ${tipoTicket === "suporte" ? "suporte" : "recebimento de produto"}, ${interaction.user}!\n\nPor favor, descreva seu problema ou o produto que deseja receber. Um membro da equipe entrará em contato em breve.`) 
            .setColor(COLORS.info)
            .setImage(config.ticketImageUrl)
            .setFooter({ text: "Para fechar este ticket, clique no botão abaixo ou use o comando /fechar_ticket", iconURL: client.user.avatarURL() })
            .setTimestamp();

        const closeButton = new ButtonBuilder()
            .setCustomId(`fechar_ticket_${ticketChannel.id}`)
            .setLabel("Fechar Ticket")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(closeButton);

        await ticketChannel.send({ content: `${interaction.user} <@&${config.ownerRoleId}> <@&${config.auxiliarRoleId}>`, embeds: [ticketEmbed], components: [row] });
        await interaction.reply({ content: `Seu ticket de ${tipoTicket === "suporte" ? "suporte" : "recebimento de produto"} foi aberto em ${ticketChannel}.`, ephemeral: true });
    }

    // BOTÃO: Fechar Ticket
    if (interaction.isButton() && interaction.customId.startsWith("fechar_ticket_")) {
        const channelId = interaction.customId.replace("fechar_ticket_", "");
        const ticket = Object.values(carrinhos).find(t => t.channelId === channelId && t.status === "open");

        if (!ticket) {
            return interaction.reply({ content: "❌ Ticket não encontrado ou já está fechado!", ephemeral: true });
        }

        // Apenas o criador do ticket ou staff pode fechar
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
        if (interaction.user.id !== ticket.userId && !isStaff) {
            return interaction.reply({ content: "❌ Você não tem permissão para fechar este ticket!", ephemeral: true });
        }

        const ticketChannel = await client.channels.fetch(channelId);
        if (ticketChannel) {
            await ticketChannel.delete();
        }

        ticket.status = "closed";
        await interaction.reply({ content: "✅ Ticket fechado com sucesso!", ephemeral: true });
    }

    // COMANDO /FECHAR_TICKET (para staff)
    if (interaction.isChatInputCommand() && interaction.commandName === "fechar_ticket") {
        const isStaff = config.staffRoleIds.some(roleId => interaction.member.roles.cache.has(roleId));
        if (!isStaff) {
            return interaction.reply({ content: "❌ Apenas staff pode usar este comando!", ephemeral: true });
        }

        const channelId = interaction.options.getChannel("canal").id;
        const ticket = Object.values(carrinhos).find(t => t.channelId === channelId && t.status === "open");

        if (!ticket) {
            return interaction.reply({ content: "❌ Ticket não encontrado ou já está fechado!", ephemeral: true });
        }

        const ticketChannel = await client.channels.fetch(channelId);
        if (ticketChannel) {
            await ticketChannel.delete();
        }

        ticket.status = "closed";
        await interaction.reply({ content: `✅ Ticket no canal 
` + "`" + channelId + "`" + ` fechado com sucesso!`, ephemeral: true });
    }
});

client.login(config.token);
