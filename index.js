const Discord = require('discord.js');
const { PermissionsBitField, GatewayIntentBits } = require('discord.js');
const client = new Discord.Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
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
    if (!client.application?.commands.cache) {
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
        }];
        await client.application.commands.set(data);
    }
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
                        if( messages.size > 0) {
                            message = null;
                        }
                    } else {
                        message = null;
                    }
                }
        }
    }
}, 600000);