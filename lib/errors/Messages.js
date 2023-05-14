'use strict';
const {register} = require('./LibError');

const Messages = {
    INVALID_OPTION: (prop, must) => `The ${prop} option must be ${must}`,
    FILE_NOT_FOUND: (file) => `File could not be found: ${file}`,
};
for (const [name, message] of Object.entries(Messages)) register(name, message);