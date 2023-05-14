"use strict";
const {MessageEmbed, WebhookClient} = require('discord.js')

class Webhook {
    /**
     * A parameter that shows whether there is a connection to the discord webhook or not
     * @type {boolean}
     */
    exists = false
    constructor(webhook_url, logs) {
        this.logs = logs
        this.webhook = new WebhookClient({url: webhook_url})
        this.send('```\n' +
            '             (\'-.                     \n' +
            '            ( OO ).-.                 \n' +
            ' ,--.       / . --. /      .-----.    \n' +
            ' |  |.-\')   | \\-.  \\      \'  .--./    \n' +
            ' |  | OO ).-\'-\'  |  |     |  |(\'-.    \n' +
            ' |  |`-\' | \\| |_.\'  |    /_) |OO  )   \n' +
            '(|  \'---.\'  |  .-.  |    ||  |`-\'|    \n' +
            ' |      |.-.|  | |  |.-.(_\'  \'--\'\\.-. \n' +
            ' `------\'`-\'`--\' `--\'`-\'   `-----\'`-\' \nlozl-auto-contests © sirok1```')
        this.exists = true
    }

    /**
     * Sends a message to the discord webhook
     * @param {string} message the text of the message to be sent
     * @param {string} color the color of the embedding strip
     */
    send(message, color) {
        this.webhook.send({
            username: "LAC_logs",
            embeds: [
                new MessageEmbed()
                    .setColor(color)
                    .setDescription(message)
                    .setTimestamp()
            ]
        }).catch(e => {
            this.exists = false
            this.logs.log("Discord webhook crashed", 'error', e)
        })
    }
}
module.exports = Webhook