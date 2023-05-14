"use strict";
const {Telegraf} = require('telegraf')
const {EventEmitter} = require('node:events')
const {message} = require('telegraf/filters')

class Bot extends EventEmitter{

    /**
     * A copy of the bot
     * @private
     */
    _instance;

    /**
     * Chat identifier to send logs and other messages to
     */
    chatId;

    /**
     * The logsHandler instance
     * @private
     */
    _logsHandler;

    /**
     * The flag that determines whether the bot listens to messages from the user
     */
    listenFlag;
    constructor(bot_token, logsHandler) {
        super();
        this._logsHandler = logsHandler
        this._instance = new Telegraf(bot_token)
        this._createListeners()
        this._graceful_stop()
        this._lunch()
    }

    /**
     * Signs up for telegram events
     * @private
     */
    _createListeners() {
        this._instance.start(async (ctx) => {
            this.chatId = ctx.chat.id
            this.emit("chatDefined")
        })

        this._instance.on(message("text"), async ctx => {
            if (this.listenFlag) {
                this.emit('2ath_get', ctx.message.text)
            }
        })
    }

    /**
     * Send a chat message with chaId
     * @param {string} message text message to be sent
     */
    send(message) {
        this._instance.telegram.sendMessage(this.chatId, `${message}`, { parse_mode: 'Markdown' }).catch(e => {
            this.chatId = null;
            this._logsHandler.log("TelegramBot crashed!", "error", e)
        })
    }

    /**
     * Forces the bot to check if it can interact with the telegram api
     * @private
     */
    _lunch() {
        try {
            this._instance.launch()
            this._instance.telegram.getMe()
                .then(() => {
                this._logsHandler.log('Telegram bot started! waiting for /start...', "inProgress")
            })
        }
        catch (e) {
            this.chatId = null
            this._logsHandler.log("TelegramBot crashed!", "error", e)
        }
    }

    /**
     * Registration of the Event Listener, on the completion of the bot, at the end of the application
     * @private
     */
    _graceful_stop() {
        process.once('SIGINT', () => this._instance.stop('SIGINT'));
        process.once('SIGTERM', () => this._instance.stop('SIGTERM'));
    }

}
module.exports = Bot