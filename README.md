## WARNING: V2 will not recive any more support or updates and should not be used
## I am activly working on v3 since 02.07.2026

# Infinity-Talks (V2)

Infinity-Talks is a nodejs discord bot for managing "talks" (voice channels) in a non private way. (Allways availabel open channels)

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
