"use strict";
const process = require('node:process')
const path = require('path')
const {DiscordWebhook} = require('./discord_webhooks')
const fs = require('fs')
const configString = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8')
const config = JSON.parse(configString)
const {Client, LogsHandler} = require('./src')
const logs = new LogsHandler(!config.alwaysOn)
const {TelegramBot} = require('./telegram_bot')
let tg_bot;


console.log("\x1b[0m", '\n' +
    '             (\'-.                     \n' +
    '            ( OO ).-.                 \n' +
    ' ,--.       / . --. /      .-----.    \n' +
    ' |  |.-\')   | \\-.  \\      \'  .--./    \n' +
    ' |  | OO ).-\'-\'  |  |     |  |(\'-.    \n' +
    ' |  |`-\' | \\| |_.\'  |    /_) |OO  )   \n' +
    '(|  \'---.\'  |  .-.  |    ||  |`-\'|    \n' +
    ' |      |.-.|  | |  |.-.(_\'  \'--\'\\.-. \n' +
    ' `------\'`-\'`--\' `--\'`-\'   `-----\'`-\' \n')
console.log("\x1b[90m", 'lozl-auto-contests © sirok1')
//checking config.json
logs.log("checking all config fields...", "inProgress")
let err = []
if (!config.lolz_url || typeof config.lolz_url !== 'string' || !config.lolz_url.startsWith('https')) err.push('lolz_url')
if (!config.license_token || typeof config.license_token !== 'string') err.push('license_token')
if (!config.login || typeof config.login !== 'string') err.push('login')
if (!config.password || typeof config.login !== 'string') err.push('password')
if (!config.profile_url || typeof config.profile_url !== 'string') err.push('profile_url')
if (typeof config.twoAuth !== "boolean") err.push("twoAuth")
if (!config.ParseContestInterval || typeof config.ParseContestInterval !== "number") err.push('ParseContestInterval')
if (config.discord_webhook_url && config.discord_webhook_url.startsWith('https://discord.com/api/webhooks')) {
    logs.discordWebhook = new DiscordWebhook(config.discord_webhook_url, logs)
    logs.log('Discord webhook loaded successfully !', 'success')
}
if (config.telegram_bot_token && typeof config.telegram_bot_token === 'string'){
    tg_bot = new TelegramBot(config.telegram_bot_token, logs)
}
if (err.length > 0){
    logs.log(`Error! These fields were not filled in or were filled in incorrectly: ${err.join(', ')}`, "error")
    process.exit(1)
}
logs.log("checking your license....", "inProgress")
const client = new Client(config.lolz_url, config.login, config.password, logs, config.twoAuth)

//checking license
client.checkLicense(config.license_token).catch((e) => {
    if (!e){
        logs.log("License check failed, you are denied access to the app, please pay for code...", "error")
    }
    process.exit(1)
})

//Setting up a periodic license check
setInterval(() => client.checkLicense(config.lecense_token), 60 * 60 * 1000)

//Binding the telegram bot and logs handler
tg_bot?.on("chatDefined", () => {
    tg_bot.send('```\n' +
        '             (\'-.                     \n' +
        '            ( OO ).-.                 \n' +
        ' ,--.       / . --. /      .-----.    \n' +
        ' |  |.-\')   | \\-.  \\      \'  .--./    \n' +
        ' |  | OO ).-\'-\'  |  |     |  |(\'-.    \n' +
        ' |  |`-\' | \\| |_.\'  |    /_) |OO  )   \n' +
        '(|  \'---.\'  |  .-.  |    ||  |`-\'|    \n' +
        ' |      |.-.|  | |  |.-.(_\'  \'--\'\\.-. \n' +
        ' `------\'`-\'`--\' `--\'`-\'   `-----\'`-\' \nlozl-auto-contests © sirok1\n```')
    logs.telegramBot = tg_bot
    client.emit('allChecked')
})

//Listening to the license confirmation event
client.once('licenseConfirmed', async () => {
    logs.log("license confirmed", "success")
    if (!tg_bot) client.emit('allChecked')
})

//Hears an event that all the initial verification has been completed
client.once('allChecked', async() => {
    logs.log("starting app...", "inProgress")
    await client.startBrowser()
        .catch(e => logs.log(e, "error"))
    await client.mainPage()
    client.logIn().catch(e => {
        logs.log(e, 'error')
        this.client.emit("cookiesError")
    })
})

//Comes here if there is an error with stored cookies and clears them
client.on("cookiesError", () => {
    Client.flush_settings()
    client.login().catch(e => {
        logs.log(e, 'error')
        this.client.emit("cookiesError")
    })
})

//Getting 2ath when from a person
client.on('2auth', async (page) => {
    logs.log("2ath code needed, please enter it", "input")
    if (tg_bot) {
        tg_bot.listenFlag = true
        tg_bot.on("2ath_get", (code) => {
            tg_bot.listenFlag = false
            if (code.length === 6 && Number(code)) {
                client.twoFactor(page, code).catch(() => {
                    logs.log("enter code again", "error")
                    page.reload().catch(console.error)
                    tg_bot.listenFlag = true
                })
            }
            else {
                logs.log("enter code again", "error")
                tg_bot.listenFlag = true
            }
        })
    }
    else {
        let stdin = process.openStdin()
        stdin.addListener('data', d => {
            if (d.toString().trim().length === 6 && Number(d.toString().trim())) {
                process.stdin.destroy()
                client.twoFactor(page, d.toString().trim()).catch(e => logs.log("enter code again", "error"))
            } else {
                logs.log("code is not valid, please try again", "error")
            }
        })
    }
})

//Launch the main functions of the application as soon as the login has been completed
client.once('mainPageLoaded', async () => {
    logs.log('forum login successful!', "success")
    logs.log("save UserAgent and cookies...", "inProgress")
    await client.savePageSetting().catch(e => logs.log(e, "error"))
    logs.log("getting you sympathies...", "inProgress")
    await client.getSympathies(config.profile_url).catch(e => logs.log(e, "error"))
    logs.log("go to the contests page...", "inProgress")
    client.contests().catch(e => logs.log(e, "error"))
    client.intervalParseContest(config.ParseContestInterval)
})



