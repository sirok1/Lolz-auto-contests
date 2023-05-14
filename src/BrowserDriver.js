"use strict";
const puppeteer = require('puppeteer');
const userAgent = require('user-agents');
const useProxy = require("puppeteer-page-proxy")
const {setTimeout:sleep} = require("node:timers/promises")
const {log} = require("winston");

/**
 * Browser interaction driver
 */
class BrowserDriver {

    /**
     * Browser instance
     */
    browser;

    /**
     * Array with existing pages
     * @type {[]}
     */
    pages = [];

    /**
     * Do I need to run the driver with a proxy
     */
    withProxying;

    /**
     * Instance of the application client
     */
    client

    /**
     * Whether the login page has been passed
     * @type {boolean}
     * @private
     */
    _login_passed = false

    /**
     * Whether the filter button is pressed
     * @type {boolean}
     * @private
     */
    _flag_clicked = false

    /**
     * The parameter that determines whether two-factor authentication is required
     * @type {boolean}
     */
    twoAuth = false
    constructor(browser, client, twoAuth, withProxying) {
        this.withProxying = withProxying
        this.browser = browser
        this.client = client
        this.twoAuth = twoAuth
    }

    async mainPage(url, settings){
        return new Promise(async (resolve, reject) => {
            this.pages = await this.browser.pages()
            let page
            if (this.pages.length) {
                page = this.pages[this.pages?.length - 1]
            }
            if (!page || page?.isClosed()){
                page = await this.browser.newPage()
            }
            if (settings) {
                await page.setUserAgent(settings.userAgent)
                await page.setCookie(...settings.cookies)
            }
            await page.goto(url, {waitUntil: "domcontentloaded", timeout: 30000})
            try {
                await page.waitForSelector('button[class="btn"]')
                await page.click('button[class="btn"]')

            } catch {}
            try {
                await page.waitForSelector('a[class="button primary login-and-signup-btn"]', {timeout: 10000})
            } catch {
                this._login_passed = true
                this.client.emit("mainPageLoaded")
            }
            resolve(true)
        })
    }

    /**
     * Go to the login and verification page
     * @param {string} url Link to login page
     * @param {string} login Login information
     * @param {string} pass Password
     * @return {Promise<unknown>}
     */
    async login(url, login, pass) {
        return new Promise(async (resolve, reject) => {
            this.pages = await this.browser.pages()
            let page
            if (this.pages.length) {
                page = this.pages[this.pages?.length - 1]
            }
            if (!page || page?.isClosed()){
                page = await this.browser.newPage()
            }
            await page.goto(url, {waitUntil: "domcontentloaded", timeout: 30000})
                .catch(e => reject(e))
            page.on('console', msg => {
                if (msg.text().startsWith('Challenge Success')) {
                    this.client.emit('captchaPassed')
                }
            })
            this.client.on('captchaPassed', async () => {
                if (!this._login_passed) {
                    await page.waitForSelector('input[value="Вход"]')
                    await page.click('input[name="login"]')
                    await page.keyboard.type(login, {delay: 300})
                    await page.click('input[name="password"]')
                    await page.keyboard.type(pass, {delay: 300})
                    await page.click('input[value="Вход"]')
                    try {
                        await page.waitForSelector('p[class="codeHasBeenSent"]', {timeout: 10000})
                        this.client.emit('2auth', page)
                    } catch (e) {
                        this._login_passed = true
                        this.client.emit('mainPageLoaded')
                    }
                }
            })
        })
    }

    /**
     * Passing verification
     * @param page the verification page
     * @param code 2ath code
     * @return {Promise<unknown>}
     */
    async twoFactor(page, code) {
        return new Promise(async (resolve, reject) => {
            await page.waitForSelector('input[id="ctrl_telegram_code"]')
            try {
                await page.click('class="close OverlayCloser"')
            }
            catch{}
            const input = await page.$('#ctrl_telegram_code');
            await input.click({clickCount: 3});
            await input.type(code, {delay: 300})
            await page.click('input[value="Подтвердить"]')
            try {
                await page.waitForSelector('div[class="discussionList"]', {timeout: 10000})
                this.client.emit('mainPageLoaded')
            }
            catch {
                reject(false)
            }

        })
    }

    /**
     * Go to the contests page
     * @param {string} url link to the contests page
     * @return {Promise<unknown>}
     */
    async contests(url) {
        return new Promise(async (resolve, reject) => {
            let page
            if (this.pages.length) {
                page = this.pages[0]
            }
            if (!page || page?.isClosed()){
                page = await this.browser.newPage()
            }
            await page.goto(url, {waitUntil: "domcontentloaded", timeout: 30000})
                .catch(e => reject(e))

            this.client.logs.log("contests page loaded successfully!", "success")
            await page.bringToFront().catch(e => this.client.logs.log(e, 'error'))
            await page.waitForSelector('a[class="OverlayTrigger button Tooltip"]').catch(e => this.client.logs.log(e, 'error'))
            if (!this._flag_clicked) {
                await page.click('a[class="OverlayTrigger button Tooltip"]').catch(e => this.client.logs.log(e, 'error'))
                this._flag_clicked = true
            }
            try {
                await page.waitForNavigation()
            }catch {}
            await page.click('span.UpdateFeedButton').catch(e => this.client.logs.log(e, "error"))
            try {
                await page.waitForSelector('div[class="NoResultsFound  muted"]', {timeout: 15000})
                reject("No contests available for participation")
            }
            catch (e) {
                resolve (true)
            }
        })
    }

    /**
     * Getting a user agent and cookies
     * @param {string} url the link of the settings of which should be taken
     * @return {Promise<unknown>}
     */
    async getPageSettings(url) {
        return new Promise(async (resolve, reject) => {
            let page
            if (this.pages.length) {
                page = this.pages[this.pages?.length - 1]
            }
            if (!page || page?.isClosed()){
                page = await this.browser.newPage()
            }
            await page.bringToFront().catch(e => reject(e))
            try {
                await page.waitForNavigation()
            }catch {}
            // let userAgent = await page.evaluate(() => navigator.userAgent)
            let cookies = await page.cookies(url)
            resolve({userAgent: userAgent, cookies: cookies})
        })
    }

    /**
     * Go to the profile page
     * @param {string} profileUrl profile link
     * @return {Promise<unknown>}
     */
    async profilePage(profileUrl){
        return new Promise(async (resolve, reject) => {
            this._login_passed = true
            let page
            if (this.pages.length < 2) {
                page = await this.browser.newPage()
            }
            else {
                page = this.pages[1]
            }
            try{
                await page.bringToFront()
            }catch{}
            await page.goto(profileUrl, {waitUntil: "domcontentloaded", timeout: 30000})
            this.pages = await this.browser.pages()
            resolve(true)
        })
    }

    /**
     * Receiving Current Sympathies
     * @return {Promise<unknown>}
     */
    async getSympathies() {
        return new Promise(async (resolve, reject) => {
            let page = this.pages[this.pages.length - 1]
            await page.bringToFront().catch(e => this.client.logs.log(e, 'error'))
            await page.waitForSelector('a[class="page_counter Tooltip"]').catch(e => reject(e))
            let selector = 'a[class="page_counter Tooltip"]'
            let res = {total: "", lastSevenDays: ""}
            res = await page.evaluate((selector) => {
                let textNode = Array.from(document.querySelectorAll(selector))
                return {total: textNode.map(el => el.innerText)}
            }, selector)
            res.lastSevenDays =  await page.evaluate('document.querySelector("a.page_counter").getAttribute("data-cachedtitle")')
            resolve(res)
        })
    }

    /**
     * Getting the link to the first contest
     * @return {Promise<unknown>}
     */
    async getFirstContest() {
        return new Promise(async (resolve, reject) => {
            let page = this.pages[0]
            await page.bringToFront().catch(e => reject(e))
            await page.waitForSelector('a.listBlock').catch(e => reject(e))
            let link = page.evaluate('document.querySelector("a.listBlock").getAttribute("data-previewurl")').catch(e => reject(e))
            resolve(link)
        })
    }

    /**
     * Participation in the contest
     * @param {string} link contest link
     * @return {Promise<unknown>}
     */
    async participate(link) {
        return new Promise(async (resolve, reject) => {
            let page = this.pages[0]
            await page.goto(link, {waitUntil: "domcontentloaded", timeout: 30000}).catch(e => reject(e))
            await page.waitForSelector('a.LztContest--Participate')
            let topicName = page.evaluate(() => {
                let text = document.querySelector('h1')
                return text.innerText
            })
            await page.evaluate(() => {
                const scrollableSection = document.querySelector('a.LztContest--Participate');
                scrollableSection.scrollIntoView(true);
            }).catch(e => reject(e))
            this.client.on('captchaPassed', async() => {
                if (this._login_passed) {
                    await page.waitForSelector('a[class="LztContest--Participate button mn-15-0-0 primary"]').catch(e => reject(e))
                    await page.click('a[class="LztContest--Participate button mn-15-0-0 primary"]').catch(e => reject(e))
                    resolve(topicName)
                }
            })
        })
    }

    /**
     * Generating and changing the new user agent
     * @param page The page instance on which you want to change the user agent
     * @return {Promise<void>}
     * @private
     */
    async _changeUserAgent(page) {
        await page.setUserAgent(userAgent.toString())
    }
}
module.exports = BrowserDriver