const { Discord, PermissionsBitField } = require('discord.js');
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] });
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
    console.log('autodelete');
});

client.on('guildCreate', guild => {
    var data = {
        "name": "autodelete",
        "description": "Set autodelete for a channel",
        "options": [
            {
                "type": 4,
                "name": "minutes",
                "description": "How many minutes should pass before message removed"
            },
            {
                "type": 7,
                "name": "channel",
                "choices": [],
                "required": true
            },
            {
                "type": 5,
                "name": "enabled",
                "required": true
            }
        ]
    };
    const command = guild.commands.set(data);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'autodelete') {
            if (interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                var channel = interaction.options.getChannel('channel');
                var enabled = interaction.options.getBoolean('enabled');
                var minutes = interaction.options.getInteger('minutes');
                await connection.promise.query('insert into channels (id, enabled, minutes) values (' + channel + ',' + enabled + ',' + minutes + ')');
                await interaction.reply({ content: 'This probably processed okay!', ephemeral: true });
            }
        }

    }

});


setInterval(async function () {
    var channels = await connection.promise.query('select * from channels');
    if (servers[0].length > 0) {
        for (const channel of channels[0]) {
            if (channel.enabled == true) {
                let message = await channel.messages.fetch({ limit: 1 }).then(messages => messages.size === 1 ? messages.at(0) : null);
                while (message) {
                    await channel.messages.fetch({ limit: 100, before: message.id }).then(messages => messages.forEach(msg => messages.push(msg)));
                    if (messages.size > 0) {
                        message = messages.at(message.size - 1)
                        for (thisMessage of messages) {
                            if (thisMessage.timestamp < (Date.now() - (channel.minutes * 60 * 1000))) { // milliseconds elapsed
                                channel.messages.delete(thisMessage.id);
                            }
                        }
                    } else {
                        message = null;
                    }
                }
            }
        }
    }
}, 120000);