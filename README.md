# autodelete

## what is this thing

does what it says it does. in discord, to be clear. ignores pinned messages in-channel.

usage: `/autodelete channel:#general enabled:true|false minutes:60`

you can omit minutes if you're disabling it

## why?

because i was bored mostly. also because i wanted to see if i could do this in fewer characters than the discord message limit. it was when i first drafted it out. i dont think it is anymore though but that's fine. you can probably still post it if you have nitro

## hey what data do you store

literally just channel ids and the delete settings you give me. ~~i guess technically i store unix timestamps of messages in an ephemeral log file on the server? but they're literally just unix timestamps and it's left over from debugging.~~ i stopped doing this. anyway i don't store message data at all ever

## i want to support you

venmo me @a_letson if you like it and want to support its operation

## can you just give me the robot already omg

https://discord.com/api/oauth2/authorize?client_id=1057726468479783052&permissions=76800&scope=applications.commands%20bot

or just host it yourself! `npm install && node index.js`, or i prefer pm2 for autorestart and all that good stuff
