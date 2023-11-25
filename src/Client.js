"use strict"
const Parser = require("./BrowserDriver");
const puppeteer = require("puppeteer-extra");
// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
puppeteer.use(StealthPlugin())
const path = require('path')
const {Util} = require('../lib')
const {executablePath} = require('puppeteer')
const axios = require("axios");
const process = require("node:process");
const {EventEmitter} = require("node:events");
const Queue = require("queue");
const fs = require('fs')

class Client extends EventEmitter{
    /**
     * Link to the main forum domain
     * @type {string}
     */
    url;

    /**
     * Login to the forum
     * @type {string}
     */
    login;

    /**
     * Forum login password
     * @type {string}
     */
    pass;

    /**
     * An instance of the browser driver class
     */
    browserDriver;

    /**
     * array with the created browsers
     * @type {[]}
     */
    browser = [];

    /**
     * A copy of the log handler
     */
    logs;

    /**
     * Cache of sympathies
     * @type {{total: number, lasSevenDays: number}}
     */
    sympathies = {
        total: 0,
        lasSevenDays: 0
    }

    /**
     * The parameter that determines whether two-factor authentication is required
     */
    twoAuth
    constructor(url, login, pass, logs, twoAuth) {
        super();
        this.url = url
        this.login = login
        this.pass = pass
        this.logs = logs
        this.twoAuth = twoAuth
        this.queue = new Queue({results: [], autostart: true, concurrency: 1})
        this._addQueueListeners()
    }

    /**
     * Handling errors that occurred in the queue
     * @private
     */
    _addQueueListeners () {
        this.queue.on('error', (err, job) => {
            this.logs.log(job.toString(), 'finished with err', "error", err)
        })
    }

    /**
     * Launching the browser
     * @return {Promise<Client>}
     */
    async startBrowser() {
        this.browser.push(await puppeteer.launch({
            executablePath: executablePath(),
            headless: "new",
            defaultViewport: null,
            args: ['--disable-web-security']
        }))
        this.browserDriver = new Parser(this.browser[this.browser.length - 1], this)
        return this
    }

    async mainPage(){
        let settings = this._read_settings_file()
        if (!settings?.cookies || !settings?.userAgent){
            this.logs.log("making new session...", "inProgress")
            settings = null
        }
        await this.browserDriver.mainPage(`${this.url}`, settings)
    }

    /**
     * Cookie-enabled login to the forum
     * @return {Promise<void>}
     */
    async logIn() {
        this.logs.log("trying to log in to the account...", "inProgress")
        this.logs.log("restore session...", "inProgress")
        await this.browserDriver.login(`${this.url}/login`, this.login, this.pass)
    }

    /**
     * Method for entering two-factor authentication
     * @param page verification page
     * @param {string} code verification code
     * @return {Promise<unknown>}
     */
    async twoFactor(page, code) {
        return new Promise(async (resolve, reject) => {
            this.logs.log("entering a two-factor authentication code to the forum...",  "inProgress")
            await this.browserDriver.twoFactor(page, code)
                .then(() => resolve(true))
                .catch(e =>
                    reject(false)
            )

        })
    }

    /**
     * The method with the main functions of participation in contests
     * @return {Promise<unknown>}
     */
    async contests() {
        return new Promise(async (resolve, reject) => {
            await this.browserDriver.contests(`${this.url}/forums/contests/`).catch(e => reject(e))
            let contest_link = await this.browserDriver.getFirstContest().catch(e => reject(e))
            if (contest_link) {
                await this.browserDriver.participate(`${this.url}/${contest_link.replace(/preview/g, "")}`)
                    .then(d => {
                        this.logs.log(`Successfully participate in \"${d}\"`, "success")
                    })
                    .catch(e => reject(e))
            }
        })
    }

    /**
     * Opening the profile page
     * @param {string} profileUrl profile link
     * @return {Promise<void>}
     */
    async profilePage(profileUrl) {
        await this.browserDriver.profilePage(profileUrl)
    }

    /**
     * Saving user agent and cookies
     * @return {Promise<boolean>}
     */
    async savePageSetting() {
        await this.browserDriver.getPageSettings(`${this.url}`)
            .then(data => {
                this._save_setting_to_File(Object.assign({}, data))
            })
        return true
    }

    /**
     * Getting the user's likes
     * @param {string} profileUrl profile link
     * @return {Promise<unknown>}
     */
    async getSympathies(profileUrl) {
        this._profileUrl = profileUrl
        return new Promise(async (resolve, reject) => {
            await this.profilePage(profileUrl).catch(e => this.logs.log(e, "error"))
            await this.browserDriver.getSympathies().then((data) => {
                this.sympathies = {
                    total: (data.total[0].split('\n'))[0],
                    lastSevenDays: data.lastSevenDays.replace(/^[\W\d\s]+-/g, "").trim()
                }
                this.logs.log(`You have ${this.sympathies.total} sympathies at all and ${this.sympathies.lastSevenDays} sympathies at last 7 days`,"success")
            })
            resolve(true)
        })
    }

    /**
     * Sets the start of the main methods on the interval
     * @param {number} numb number of minutes after how many minutes to repeat the cycle
     */
    intervalParseContest(numb) {
        setInterval(() => this.getSympathies(this._profileUrl).catch(e => this.logs.log(e, "error")), numb * 60 * 1000)
        setInterval(() => this.contests().catch(e => this.logs.log(e, "error")), (numb * 60 * 1000) + 30000)
    }

    /**
     * Saves user agent and cookies to a file
     * @param {Object} settings object with the necessary settings
     * @private
     */
    _save_setting_to_File(settings) {
        this.queue.push(() => {
            return new Promise((resolve, reject) => {
                fs.writeFile(Util.checkPath(path.join(__dirname, '../.settings.json' ), 'file', '.settings.json'), JSON.stringify(settings), {encoding: "utf-8"}, (err) => {
                    if (err) reject(err)
                })
            })
        })
    }

    /**
     * Reads settings from a file
     * @return {Object} settings as an object
     * @private
     */
    _read_settings_file() {
        let setting_string = fs.readFileSync(Util.checkPath(path.join(__dirname, '../.settings.json' ), 'file', '.settings.json'), {encoding: "utf-8"})
        return JSON.parse(setting_string)
    }

    /**
     * Checking the application's license key
     * @param {string} license_token test key
     * @return {Promise<unknown>}
     */
    async checkLicense(license_token) {
        //here was a license check, acting as a guarantor in the transfer of the code
        setTimeout(() => this.emit('licenseConfirmed'), 1000 * 5)
    }

    /**
     * Cleaning the cookie and user agent file
     */
    static flush_settings(){
        const fs = require('fs')
        fs.writeFileSync(path.join(__dirname, '.settings.json'),"{}", 'utf-8')
    }
}
module.exports = Client
