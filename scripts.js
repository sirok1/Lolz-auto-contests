'use strict';
const process = require('node:process')
const path = require('path')
const pjson = require('./package.json');
const fs = require("fs");

//Creates a copy-protected and stolen release
if(process.argv[2] === '--createProtectedRelease'){
    const zl = require("zip-lib")
    const zip = new zl.Zip()
    zip.addFile(path.join(__dirname, 'LICENSE'))
    zip.addFile(path.join(__dirname, 'package.json'))
    zip.addFile(path.join(__dirname, 'README.md'))
    zip.addFile(path.join(__dirname, 'config.json'))
    zip.addFile(path.join(__dirname, '.settings.json'))
    zip.addFile(path.join(__dirname, '.puppeteerrc.cjs'))
    zip.addFolder(path.join(__dirname, 'scripts'), 'scripts')
    zip.addFolder(path.join(__dirname, 'logs'), 'logs')
    zip.addFile(path.join(__dirname, 'dist/index.js'))
    zip.archive(path.join(__dirname, `v${pjson.version}.zip`))
        .then(() => console.log('release created successfully'))
        .catch(console.error)
}

//Validating paths in the build
if (process.argv[2] === "--validatePaths") {
    console.log('validating paths...')
    const fs = require('fs')
    const buildFile = fs.readFileSync(path.join(__dirname, 'dist/bundled.js'), "utf-8")
    let validated = buildFile.replace(/..\/.settings.json/g, './.settings.json')
    fs.writeFileSync(path.join(__dirname, 'dist/bundled.js'), validated, 'utf-8')
    console.log('success')
}

//Resetting settings (cookies and user agent)
if (process.argv[2] === "--flushSetting") {
    console.log("flushing settings...")
    const fs = require('fs')
    fs.writeFileSync(path.join(__dirname, '.settings.json'),"{}", 'utf-8')
    console.log("success")
}

//Clearing logs
if (process.argv[2] === "--flushLogs") {
    console.log("flushing logs...")
    const fs = require('fs')
    fs.writeFileSync(path.join(__dirname, 'logs/error.log'),"", 'utf-8')
    fs.writeFileSync(path.join(__dirname, 'logs/combined.log'),"", 'utf-8')
    console.log("success")
}