const obfuscator = require("javascript-obfuscator")
const fs = require('fs')
const path = require('path')

const sourceCode = fs.readFileSync(path.join(__dirname, 'dist/bundled.js'), 'utf-8')

const obfuscationResult = obfuscator.obfuscate(sourceCode, {
    target: "node",
    stringArrayWrappersType: "function",

})
fs.unlink(path.join(__dirname, 'dist/bundled.js'), (err) => {
    if (err) throw err
})
fs.writeFileSync(`${path.join(__dirname, 'dist/')}/index.js`, obfuscationResult.getObfuscatedCode())
process.exit(0)