"use strict";
const winston = require('winston')
const path = require('path')

/**
 * A class that takes logs and sends them to multiple sources at once
 */
class LogsHandler {
    /**
     * Shows whether "live logs" are needed
     * @type {boolean}
     * @private
     */
    _live= true;
    /**
     * A dictionary that determines the color of "live" logs by message type
     * @type {{input: string, warn: string, inProgress: string, success: string, error: string}}
     * @private
     */
    _messages = {
        error: "\x1b[31m",
        success: "\x1b[32m",
        inProgress: "\x1b[33m",
        input: "\x1b[35m",
        warn: "\x1b[43m"
    }
    /**
     * Variable that will store an instance of the discord webhook class
     * @type {null|Object}
     */
    discordWebhook = null;
    /**
     * Variable that will store an instance of the telegram bot class
     * @type {null|Object}
     */
    telegramBot = null;
    constructor(consoleLive) {
        this._live = consoleLive
         this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.json(),
            defaultMeta: { service: 'LAC' },
            transports: [
                //
                // - Write all logs with importance level of `error` or less to `error.log`
                // - Write all logs with importance level of `info` or less to `combined.log`
                //
                new winston.transports.File({ filename: `${path.join(__dirname, '../logs/error.log')}`, level: 'error' }),
                new winston.transports.File({ filename: `${path.join(__dirname,'../logs/combined.log')}`}),
            ],
        });

    }

    /**
     * A method that allows you to send a log to all existing logging types
     * @param {string} message message to be sent
     * @param {string} type logging type
     * @param {*[]} args Other arguments that need to be passed to the logic
     */
    log(message, type, ...args){
        //Dictionary and logging to files
        let winstonDictionary = []
        winstonDictionary['error'] = 'error'
        winstonDictionary['input'] = 'info'
        winstonDictionary['success'] = 'info'
        winstonDictionary['inProgress'] = 'info'
        winstonDictionary['warn'] = 'warn'
        let arg = [...args]
        this.logger.log({
            level: winstonDictionary[type],
            message: `${message} ${arg.join(' ')}`
        })

        //Dictionary and discord logging
        let webhookDictionary = []
        webhookDictionary['error'] = 'RED'
        webhookDictionary['input'] = '#2F3136'
        webhookDictionary['success'] = 'GREEN'
        webhookDictionary['inProgress'] = 'YELLOW'
        webhookDictionary['warn'] = 'ORANGE'
        if(this.discordWebhook && this.discordWebhook?.exists){
            try {
                this.discordWebhook.send(`${message} ${arg.join(' ')}`, webhookDictionary[type])
            }
            catch (e) {
                console.error(e)
            }
        }

        //Dictionary and Logging in Telegram
        let telegramDictionary = []
        telegramDictionary['error'] = '❌'
        telegramDictionary['input'] = '⌨️'
        telegramDictionary['success'] = '✅'
        telegramDictionary['inProgress'] = '⚙️'
        telegramDictionary['warn'] = '⚠️'
        if(this.telegramBot && this.telegramBot.chatId){
            try {
                this.telegramBot.send(`${telegramDictionary[type]} ${message} ${arg.join(' ')}`)
            }
            catch (e) {
                console.error(e)
            }
        }

        //console logging
        if (this._live) {
            if (type !=="error" && type !=="warn"){
                console.log(this._messages[type], message, ...args, "\x1b[0m")
            }
            else if (type === 'error'){
                console.error(this._messages[type], message, ...args, "\x1b[0m")
            }
            else if (type === 'warn') {
                console.warn(this._messages[type], message, ...args, "\x1b[0m")
            }
        }
    }
}
module.exports = LogsHandler