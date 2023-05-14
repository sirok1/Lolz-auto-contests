'use strict';

const fs = require('fs');
const Path = require('path');
// const {parse} = require('node:path');
const process = require('node:process');
const {TypeError} = require('./errors');
// const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
// const inObject = s => typeof s === 'object' && s !== null;
class Util extends null {

    /**
     * Get files to an Array
     * @param dir The path to the folder whose files you want to get
     * @return {*[]}
     */
    static getAllFiles(dir) {
        let files;
        try {
            files = fs.readdirSync(dir, {
                withFileTypes: true,
            });
        } catch (err) {
            files = [];
        }
        let jsFiles = [];
        if (files.length > 0) {
            for (const file of files) {
                if (file.isDirectory()) {
                    jsFiles = [...jsFiles, ...this.getAllFiles(`${dir}/${file.name}`)];
                } else if (file.name.endsWith('.js') && !file.name.startsWith('!')) {
                    let filename = file.name.replace(/\\/g, '/').split('/');
                    filename = filename[filename.length - 1];
                    filename = filename.split('.')[0].toLowerCase();
                    jsFiles.push({name: filename, path: `${dir}/${file.name}`});
                }
            }
            return jsFiles;
        }
        else return null;
    }

    /***
     * Find the biggest length of sub array
     * @param arr
     * @return {number}
     */
    static biggestSize(arr) {
        let biggest = 0
        for (let rule of arr) {
            if (rule.price.length > biggest) biggest = rule.price.length
        }
        return biggest
    }

    /**
     * Makes simple error
     * @param {Object }err Error object
     * @returns {{stack: *, name, message}}
     */
    static makeSimpleError(err) {
        return {
            name: err.name,
            message: err.message,
            stack: err.stack
        };
    }

    /**
     * Checks if path is ok
     * @param {string|null} path Path to check
     * @param {string} type Type of what to check (directory or file)
     * @param {string} name The name of the function that called this
     * @return {string|null} The absolute path
     */
    static checkPath(path, type, name){
        if (!path) return null;
        if (!Path.isAbsolute(path)) {
            const res = Path.resolve(process.cwd(), path);
            const stats = fs.statSync(path);
            if (type === 'file') {
                if (!stats.isFile()) throw new TypeError('INVALID_OPTION', `${name}`, 'file');
                return res;
            } else if (type === 'directory') {
                if (!stats.isDirectory()) throw new TypeError('INVALID_OPTION', `${name}`, 'directory');
                return res;
            }
            else {
                throw new TypeError('INVALID_OPTION', `${name}`, 'file or directory');
            }
        }
        else{
            const stats = fs.statSync(path);
            if (type === 'file') {
                if (!stats.isFile()) throw new TypeError('INVALID_OPTION', `${name}`, 'file');
                return path;
            } else if (type === 'directory') {
                if (!stats.isDirectory()) throw new TypeError('INVALID_OPTION', `${name}`, 'directory');
                return path;
            }
            else {
                throw new TypeError('INVALID_OPTION', `${name}`, 'file or directory');
            }
        }
    }
}
module.exports = Util;