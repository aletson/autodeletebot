# autodelete

does what it says it does. ignores pinned messages in-channel.

usage: `/autodelete channel:#general enabled:true|false minutes:60`

you can omit minutes if you're disabling it in a channel

todo: maybe support removing pins as a toggle, maybe pin a message from the robot in the channel saying what it's doing

## hey what data do you store

literally just channel ids and the delete settings you give me. i guess technically i store unix timestamps of messages in an ephemeral log file on the server? but they're literally just unix timestamps and it's left over from debugging. there's no like...message data or ids or anything stored in any way.

## i want to support you

venmo me @a_letson if you like it and want to support its operation

https://discord.com/api/oauth2/authorize?client_id=1057726468479783052&permissions=76800&scope=applications.commands%20bot
