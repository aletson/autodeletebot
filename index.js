const Discord = require('discord.js');
const { PermissionsBitField, GatewayIntentBits, EmbedBuilder, Partials } = require('discord.js');
const client = new Discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions], partials: [Partials.Message, Partials.Channel, Partials.Reaction], });
var mysql = require('mysql2');
var connection = mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_pass,
    database: process.env.db,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: true
});
connection.connect();
client.login(process.env.app_token);

client.on('ready', async () => {
    //if (!client.application?.commands.cache) {
    var data = [{
        "name": "autodelete",
        "description": "Set autodelete for a channel",
        "options": [
            {
                "type": 7,
                "name": "channel",
                "description": "The channel in question",
                "choices": [],
                "required": true
            },
            {
                "type": 5,
                "name": "enabled",
                "description": "enable autodelete or not",
                "required": true
            },
            {
                "type": 4,
                "name": "minutes",
                "description": "How many minutes should pass before message removed",
            }
        ]
    },
    {
        "name": "hof",
        "description": "set up hall of fame functionality",
        "options": [
            {
                "type": 3,
                "name": "emoji_id",
                "description": "Right click on the emoji you want and click \"Copy ID\".",
                "required": true
            },
            {
                "type": 7,
                "name": "channel",
                "description": "The channel to set as the Hall of Fame",
                "required": true
            },
            {
                "type": 4,
                "name": "threshold",
                "description": "How many people must react",
                "required": true
            },
            {
                "type": 5,
                "name": "admin_override",
                "description": "If a react from an admin automatically HOF's regardless of threshold",
                "required": true
            }
        ]
    }];
    await client.application.commands.set(data);
    //}
});

client.on('guildCreate', async (guild) => {
    var data = [{
        "name": "autodelete",
        "description": "Set autodelete for a channel",
        "options": [
            {
                "type": 7,
                "name": "channel",
                "description": "The channel in question",
                "choices": [],
                "required": true
            },
            {
                "type": 5,
                "name": "enabled",
                "description": "enable autodelete or not",
                "required": true
            },
            {
                "type": 4,
                "name": "minutes",
                "description": "How many minutes should pass before message removed",
            }
        ]
    },
    {
        "name": "hof",
        "description": "set up hall of fame functionality",
        "options": [
            {
                "type": 3,
                "name": "emoji_id",
                "description": "Right click on the emoji you want and click \"Copy ID\".",
                "required": true
            },
            {
                "type": 7,
                "name": "channel",
                "description": "The channel to set as the Hall of Fame",
                "required": true
            },
            {
                "type": 4,
                "name": "threshold",
                "description": "How many people must react",
                "required": true
            },
            {
                "type": 5,
                "name": "admin_override",
                "description": "If a react from an admin automatically HOF's regardless of threshold",
                "required": true
            }
        ]
    }];
    await guild?.commands.set(data);
});

client.on('rateLimit', (...args) => console.log('rateLimit', ...args));

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'autodelete') {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                var channel = interaction.options.getChannel('channel');
                var enabled = interaction.options.getBoolean('enabled');
                var minutes = interaction.options.getInteger('minutes');
                var isChannel = await connection.promise().query('select * from channels where id = ?', channel.id);
                if (isChannel[0].length > 0) {
                    if (enabled == true) {
                        var queryData = [enabled, minutes, channel.id];
                        await connection.promise().query('update channels set enabled = ?, minutes = ? where id = ?', queryData);
                    } else {
                        var queryData = [enabled, channel.id];
                        await connection.promise().query('update channels set enabled = ? where id = ?', queryData);
                    }
                } else {
                    await connection.promise().query('insert into channels (id, enabled, minutes) values (' + channel.id + ',' + enabled + ',' + minutes + ')');
                }
                await interaction.reply({ content: 'This probably processed okay!', ephemeral: true });
            }
        } else if (interaction.commandName === 'hof') {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                var channel = interaction.options.getChannel('channel');
                var emoji_id = interaction.options.getString('emoji_id');
                var threshold = interaction.options.getInteger('threshold');
                var admin_override = interaction.options.getBoolean('admin_override');
                var isHof = await connection.promise().query('select * from hof where guild_id = ?', interaction.guild.id);
                var queryData = [channel.id, emoji_id, threshold, admin_override, interaction.guild.id];
                if (isHof[0].length > 0) {
                    await connection.promise().query('update hof set channel = ?, emoji_id = ?, threshold = ?, admin_override = ? where guild_id = ?', queryData);
                } else {
                    await connection.promise().query('insert into hof (channel, emoji_id, threshold, admin_override, guild_id) values (?, ?, ?, ?, ?)', queryData);
                }
                await interaction.reply({ content: 'This probably processed okay!', ephemeral: true });
            }
        }

    }

});


function messageDelete(message, channel, channelObj) {
    if (message.createdTimestamp < (Date.now() - (channel.minutes * 60 * 1000)) && message.pinned == false) { // milliseconds elapsed
        channelObj.messages.delete(message.id);
    }
}
setInterval(async function () {
    var channels = await connection.promise().query('select * from channels where enabled = 1');
    if (channels[0].length > 0) {
        for (const channel of channels[0]) {
            let channelObj = await client.channels.cache.get(channel.id);
            let message = await channelObj.messages.fetch({ limit: 1 });
            if (message) {
                var messages = await channelObj.messages.fetch({ limit: 100, before: message.id });
            }
            while (message) {
                if (messages.size > 0) {
                    message = messages.at(message.size - 1);
                    let newMessages = await channelObj.messages.fetch({ limit: 100, before: message.id });
                    let thisDeleteBatch = messages.map(message => messageDelete(message, channel, channelObj));
                    await Promise.all(thisDeleteBatch);
                    messages = newMessages;
                    if (messages.size > 0) {
                        message = null;
                    }
                } else {
                    message = null;
                }
            }
        }
    }
}, 600000);

client.on('messageReactionAdd', async function (reaction, user) {
    if (reaction.partial) {
        await reaction.fetch();
    }
    //todo cache reactions
    console.log(reaction.emoji.id);
    var hofData = await connection.promise().query('select * from hof where guild_id = ?', reaction.message.guildId);
    var member = await reaction.message.guild.members.cache.get(user.id);
    if (hofData[0].length > 0 && reaction.emoji.id == hofData[0][0].emoji_id && (reaction.count >= hofData[0][0].threshold || (hofData[0][0].admin_override == true && member.permissions.has(PermissionsBitField.Flags.Administrator)))) {
        console.log('checks passed');
        var is_hof = await connection.promise().query('select * from hof_msg where message_id = ?', reaction.message.id);
        if (is_hof[0].length <= 0) {
            console.log('isnt in hof');
            //create pin (message embed / rich formatting)
            const embeddedMessage = new EmbedBuilder()
                .setColor(0xFFD700)
                .setAuthor({ name: reaction.message.member.displayName });
            if (reaction.message.content.length > 0) {
                embeddedMessage.setDescription(reaction.message.content);
            }
            console.log(reaction.message.attachments);
            if (reaction.message.attachments[0]) {
                embeddedMessage.setImage(reaction.message.attachments[0].url);
            }
            embeddedMessage.setFields({ name: 'Source', value: reaction.message.url })
                .setTimestamp();
            var channel = await client.channels.cache.get(hofData[0][0].channel);
            await channel.send({ embeds: [embeddedMessage], message: reaction.message.channel.toString() });
            await connection.promise().query('insert into hof_msg (message_id) values (?)', reaction.message.id);
        }


    } else {
        if (hofData[0].length == 0) {
            console.log('no hof set');
        }
        if (reaction.emoji.id != hofData[0][0].emoji_id) {
            console.log('wrong emoji - ' + reaction.emoji.id + ' != ' + hofData[0][0].emoji_id);
        }
        if (reaction.count < hofData[0].threshold) {
            console.log('threshold not met');
        }
        if (hofData[0][0].admin_override == true) {
            console.log('admin override on');
            if (member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                console.log('they\'re an admin!');
            }
        }
    }
});