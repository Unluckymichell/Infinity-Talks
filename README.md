# Invite:

https://discord.com/oauth2/authorize?client_id=775790075061338152&scope=bot&permissions=248912&redirect_uri=https%3A%2F%2Finftalks.mischael.dev

# Infinity-Talks (V2)

Infinity-Talks is a nodejs discord bot for managing "talks" (voice channels) in a non private way. (Allways availabel open channels)

## Disclaimer

Util full Version 2 it's not recommend to use this bot. (See progress in [rewrite](https://github.com/Unluckymichell/Infinity-Talks/tree/rewrite-chat-system) branch)\
If you still decide to use the bot, I would be happy if you inform me about any bugs found and pass on possible suggestions to me!

## Overview

This bot is not meant as a private channel bot. There are plenty other good solutions.

It's intended to big servers having free open "talks" that can be used by any member.
The main concept is as simple as having always an empty talk to join without occupying to much space.
Users that have joined into one of these talks are able to lock the channel or edit basic stuff like the bitrate.

Every feature of the bot is configurable and I'm open to suggestions for further features.

The bot is written in node js using the discord [Eris](https://abal.moe/Eris/) api wrapper.

## Installation

You can get a invite link to my hosted version here

If you want to host your own version of this bot. Just clone the repo and run `npm install`

Configure the bot using dotEnv or actual env vars.\

### .env sample file

```
TOKEN=[DISCORD BOT TOKEN]
DBURL=[DISCORD BOT TOKEN] (Sample: mongodb://localhost/infinitytalks)
REDIRURL=[DISCORD OAUTH REDIR URL] (Sample: https://inftalks.mischael.dev/api/discord/callback) (Note: For discord oauth! Needs to math url in developer Pannel)
PORT=[WEB CONFIGURATOR PORT]
CLIENT_ID=[DISCORD CLIENT ID]
CLIENT_SECRET=[DISCORD CLIENT SECRET]
```

You will then be able to run `npm start` to launch the bot

## License

Well just do what you want with this. Im not forcing you as mentioned in the licese but would be happy to se me creddited if this software is coppied / further developed.

[MIT License](https://github.com/Unluckymichell/Infinity-Talks/blob/master/LICENSE)
