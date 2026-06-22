const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.DirectMessages] });
const config = require("./config.json");
const fs = require("fs");

let products = require("./products.json");
let tickets = require("./tickets.json");

client.once("ready", () => {
    console.log("Bot está online!");
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(config.prefix)) return;

    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // Comandos de administração
    if (command === "addproduct") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 4) {
            return message.reply("Uso correto: `!addproduct <nome> <descrição> <preço> <id_do_canal>`");
        }

        const name = args[0];
        const description = args[1];
        const price = parseFloat(args[2]);
        const channelId = args[3];

        if (isNaN(price)) {
            return message.reply("O preço deve ser um número válido.");
        }

        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            name,
            description,
            price,
            channelId,
            stock: []
        };

        products.push(newProduct);
        fs.writeFileSync("./products.json", JSON.stringify(products, null, 4));

        message.reply(`Produto \'${name}\' adicionado com sucesso! ID: ${newProduct.id}`);
    } else if (command === "editproduct") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 3) {
            return message.reply("Uso correto: `!editproduct <id_produto> <campo> <novo_valor>` (campos: name, description, price, channelId)");
        }

        const productId = parseInt(args[0]);
        const field = args[1];
        const newValue = args.slice(2).join(" ");

        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return message.reply("Produto não encontrado.");
        }

        if (!["name", "description", "price", "channelId"].includes(field)) {
            return message.reply("Campo inválido. Campos permitidos: `name`, `description`, `price`, `channelId`.");
        }

        if (field === "price" && isNaN(parseFloat(newValue))) {
            return message.reply("O novo valor para o preço deve ser um número válido.");
        }

        products[productIndex][field] = (field === "price") ? parseFloat(newValue) : newValue;
        fs.writeFileSync("./products.json", JSON.stringify(products, null, 4));

        message.reply(`Produto ID ${productId} atualizado com sucesso! Campo \'${field}\' agora é: ${newValue}`);
    } else if (command === "listproducts") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (products.length === 0) {
            return message.reply("Nenhum produto cadastrado.");
        }

        const productListEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("Produtos Cadastrados")
            .setDescription("Lista de todos os produtos disponíveis:");

        products.forEach(product => {
            productListEmbed.addFields(
                { name: `ID: ${product.id} - ${product.name}`, value: `Descrição: ${product.description}\nPreço: R$ ${product.price.toFixed(2)}\nCanal: <#${product.channelId}>\nEstoque: ${product.stock.length}` }
            );
        });

        message.channel.send({ embeds: [productListEmbed] });
    } else if (command === "removeproduct") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 1) {
            return message.reply("Uso correto: `!removeproduct <id_produto>`");
        }

        const productId = parseInt(args[0]);
        const initialLength = products.length;
        products = products.filter(p => p.id !== productId);

        if (products.length === initialLength) {
            return message.reply("Produto não encontrado.");
        }

        fs.writeFileSync("./products.json", JSON.stringify(products, null, 4));
        message.reply(`Produto ID ${productId} removido com sucesso.`);
    } else if (command === "addstock") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 2) {
            return message.reply("Uso correto: `!addstock <id_produto> <item1,item2,item3...>`");
        }

        const productId = parseInt(args[0]);
        const items = args.slice(1).join(" ").split(",").map(item => item.trim());

        const product = products.find(p => p.id === productId);

        if (!product) {
            return message.reply("Produto não encontrado.");
        }

        product.stock.push(...items);
        fs.writeFileSync("./products.json", JSON.stringify(products, null, 4));

        message.reply(`${items.length} itens adicionados ao estoque do produto ID ${productId}. Total no estoque: ${product.stock.length}`);
    } else if (command === "viewstock") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 1) {
            return message.reply("Uso correto: `!viewstock <id_produto>`");
        }

        const productId = parseInt(args[0]);
        const product = products.find(p => p.id === productId);

        if (!product) {
            return message.reply("Produto não encontrado.");
        }

        if (product.stock.length === 0) {
            return message.reply(`O produto \'${product.name}\' (ID: ${productId}) não possui itens em estoque.`);
        }

        const stockList = product.stock.map((item, index) => `${index + 1}. ${item}`).join("\n");
        const stockEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle(`Estoque de \'${product.name}\' (ID: ${productId})`)
            .setDescription(`Total de itens: ${product.stock.length}\n\n${stockList}`);

        message.channel.send({ embeds: [stockEmbed] });
    } else if (command === "postproduct") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        if (args.length < 1) {
            return message.reply("Uso correto: `!postproduct <id_produto>`");
        }

        const productId = parseInt(args[0]);
        const product = products.find(p => p.id === productId);

        if (!product) {
            return message.reply("Produto não encontrado.");
        }

        const productEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle(product.name)
            .setDescription(product.description)
            .addFields(
                { name: "Preço", value: `R$ ${product.price.toFixed(2)}`, inline: true },
                { name: "Estoque", value: `${product.stock.length} unidades`, inline: true }
            )
            .setFooter({ text: `ID do Produto: ${product.id}` });

        const buyButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`buy_${product.id}`)
                    .setLabel("Comprar")
                    .setStyle(ButtonStyle.Success),
            );

        try {
            const targetChannel = await client.channels.fetch(product.channelId);
            if (!targetChannel) {
                return message.reply("Canal de destino não encontrado. Verifique o ID do canal.");
            }
            await targetChannel.send({ embeds: [productEmbed], components: [buyButton] });
            message.reply(`Produto \'${product.name}\' postado com sucesso no canal <#${product.channelId}>.`);
        } catch (error) {
            console.error("Erro ao postar produto:", error);
            message.reply("Ocorreu um erro ao tentar postar o produto no canal. Verifique as permissões do bot e o ID do canal.");
        }
    }

    // Comandos de suporte
    if (command === "ticket") {
        const existingTicket = tickets.find(t => t.userId === message.author.id && t.status === "open");
        if (existingTicket) {
            return message.reply(`Você já tem um ticket aberto no canal <#${existingTicket.channelId}>.`);
        }

        const ticketChannel = await message.guild.channels.create({
            name: `ticket-${message.author.username}`,
            type: ChannelType.GuildText,
            parent: message.channel.parent, // Cria no mesmo grupo de canais
            permissionOverwrites: [
                {   // Permissões para o usuário que abriu o ticket
                    id: message.author.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {   // Permissões para o bot
                    id: client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels]
                },
                {   // Permissões para a role de suporte (substitua 'ID_DA_ROLE_DE_SUPORTE' pela ID real)
                    id: message.guild.roles.everyone.id, // Ou uma role específica de suporte
                    deny: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        });

        const newTicket = {
            id: tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1,
            userId: message.author.id,
            channelId: ticketChannel.id,
            status: "open",
            createdAt: new Date()
        };
        tickets.push(newTicket);
        fs.writeFileSync("./tickets.json", JSON.stringify(tickets, null, 4));

        const ticketEmbed = new EmbedBuilder()
            .setColor("#ffcc00")
            .setTitle("Novo Ticket de Suporte")
            .setDescription(`Bem-vindo ao seu canal de suporte, ${message.author}! Descreva seu problema e aguarde um membro da equipe.`);

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`close_ticket_${newTicket.id}`)
                    .setLabel("Fechar Ticket")
                    .setStyle(ButtonStyle.Danger),
            );

        ticketChannel.send({ content: `${message.author}`, embeds: [ticketEmbed], components: [closeButton] });
        message.reply(`Seu ticket foi aberto em ${ticketChannel}.`);
    } else if (command === "closeticket") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const ticketId = parseInt(args[0]);
        const ticketIndex = tickets.findIndex(t => t.id === ticketId && t.status === "open");

        if (ticketIndex === -1) {
            return message.reply("Ticket não encontrado ou já está fechado.");
        }

        const ticket = tickets[ticketIndex];
        const ticketChannel = await client.channels.fetch(ticket.channelId);

        if (ticketChannel) {
            await ticketChannel.delete("Ticket fechado pelo administrador.");
        }

        tickets[ticketIndex].status = "closed";
        fs.writeFileSync("./tickets.json", JSON.stringify(tickets, null, 4));

        message.reply(`Ticket ID ${ticketId} fechado com sucesso.`);
    }

    // Outros comandos (ex: !ping)
    if (command === "ping") {
        message.reply("Pong!");
    }
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith("buy_")) {
        const productId = parseInt(interaction.customId.split("_")[1]);
        const product = products.find(p => p.id === productId);

        if (!product) {
            return interaction.reply({ content: "Produto não encontrado.", ephemeral: true });
        }

        if (product.stock.length === 0) {
            return interaction.reply({ content: "Este produto está fora de estoque no momento.", ephemeral: true });
        }

        // Simular processo de pagamento (aqui você integraria com um gateway de pagamento real)
        await interaction.reply({ content: `Você clicou em comprar \'${product.name}\'. Iniciando processo de pagamento... (Isso é uma simulação)`, ephemeral: true });

        // Após pagamento bem-sucedido (simulado)
        const deliveredItem = product.stock.shift(); // Remove o primeiro item do estoque
        fs.writeFileSync("./products.json", JSON.stringify(products, null, 4));

        const deliveryEmbed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("Entrega Realizada!")
            .setDescription(`Obrigado por sua compra de \'${product.name}\'!\n\nSeu item foi entregue abaixo:\n\n\
` + "```\n" + deliveredItem + "\n```")
            .setFooter({ text: "Se precisar de suporte, use o comando !ticket." });

        try {
            await interaction.user.send({ embeds: [deliveryEmbed] });
            interaction.followUp({ content: "Seu produto foi entregue via DM!", ephemeral: true });
        } catch (error) {
            console.error("Erro ao enviar DM para o usuário:", error);
            interaction.followUp({ content: "Não foi possível enviar o produto via DM. Por favor, verifique suas configurações de privacidade ou entre em contato com o suporte.", ephemeral: true });
        }
    } else if (interaction.customId.startsWith("close_ticket_")) {
        const ticketId = parseInt(interaction.customId.split("_")[2]);
        const ticketIndex = tickets.findIndex(t => t.id === ticketId && t.status === "open");

        if (ticketIndex === -1) {
            return interaction.reply({ content: "Ticket não encontrado ou já está fechado.", ephemeral: true });
        }

        const ticket = tickets[ticketIndex];

        // Apenas o usuário que abriu o ticket ou um administrador pode fechar via botão
        if (interaction.user.id !== ticket.userId && !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "Você não tem permissão para fechar este ticket.", ephemeral: true });
        }

        const ticketChannel = await client.channels.fetch(ticket.channelId);

        if (ticketChannel) {
            await ticketChannel.delete("Ticket fechado pelo usuário ou administrador.");
        }

        tickets[ticketIndex].status = "closed";
        fs.writeFileSync("./tickets.json", JSON.stringify(tickets, null, 4));

        interaction.reply({ content: `Ticket ID ${ticketId} fechado com sucesso.`, ephemeral: true });
    }
});

client.login(config.token);
