require('colors');
const path = require('path');
const fs = require('fs');
const {getAllFiles} = require('./utils');
let i18nFile;
let messages = {};
let rootPath;
let rootNode = '';

const initMessage = () => {
    try {
        messages = require(i18nFile);
    } catch (e) {
        console.error(`国际化资源文件 ${i18nFile} 错误或不存在，请确认后重试（注意，国际化文件不要使用 ES Module）`.red);
        process.exit(0);
    }
};

const getMessage = (key) => {
    try {
        key = key.split('.');
        let message = messages;
        key.forEach(item => {
            message = message[item];
        });
        return message;
    } catch (e) {
        console.error(`KEY: ${key} 查找国际化资源失败，请查证后继续执行代码`.red);
        process.exit(0);
    }
};

const converParamsMessage = (params, message) => {
    params = params.replace(/]$/, '').split(',');
    return '`' + message.replace(/{[\s\t]*(\d)[\s\t]*}/gim, (_, match) => {
        return '${' + params[match - 0] + '}';
    }) + '`';
};

const revertVueFile = file => {
    let processFile = path.relative(process.cwd(), file);
    console.log(`➤ ${processFile.yellow}`.blue);
    let content = fs.readFileSync(file, 'utf8');
    //替换template中的部分
    content = content.replace(/<template(.|\n|\r)*template>/gim, match => {
        let result = match.replace(/{{(this\.)?\$t\(([^{}]+)\)}}/gim, (_, _this, match) => {
            match = match.replace(/^\$t\(/, '').replace(/\)$/, '').split(/,[\s\t]*[\[{]/);
            let key = match[0].trim().replace(/['"]/g, '');
            key = rootNode ? `${rootNode}.${key}` : key;
            let message = getMessage(key);
            if (match.length > 1) {
                return `{{${converParamsMessage(match[1].trim(), message)}}`;
            }
            return message;
        });

        return result.replace(/(:[^'"]+['"])(this\.)?\$t\(([^()]+)\)(['"])/gim, (_, prev, _this, match, after) => {
            match = match.split(/,[\s\t]*[\[{]/);
            let key = match[0].trim().replace(/['"]/g, '');
            key = rootNode ? `${rootNode}.${key}` : key;
            let message = getMessage(key);
            if (match.length > 1) {
                return `${prev}{{${converParamsMessage(match[1].trim(), message)}}}${after}`;
            }
            return `${prev.replace(/^:/, '')}${message}${after}`;
        });
    });
    //替换script中的部分
    content = content.replace(/<script(.|\n|\r)*script>/gim, match => {
        return match.replace(/this\.\$t\(([^()]+)\)/gim, (_, match) => {
            match = match.split(/,[\s\t]*[\[{]/);
            let key = match[0].trim().replace(/['"]/g, '');
            key = rootNode ? `${rootNode}.${key}` : key;
            let message = getMessage(key);
            if (match.length > 1) {
                return converParamsMessage(match[1].trim(), message);
            }
            return `'${message}'`;
        });
    });
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✔ ${processFile.yellow}`.green);
};
const revertJsFile = file => {
    let processFile = path.relative(process.cwd(), file);
    console.log(`➤ ${processFile.yellow}`.blue);
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/(this\.)?\$t\(([^()]+)\)/gim, (_, _this, match) => {
        match = match.split(/,[\s\t]*[\[{]/);
        let key = match[0].trim().replace(/['"]/g, '');
        key = rootNode ? `${rootNode}.${key}` : key;
        let message = getMessage(key);
        if (match.length > 1) {
            return converParamsMessage(match[1].trim(), message);
        }
        return `'${message}'`;
    });
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✔ ${processFile.yellow}`.green);
};

module.exports.revert = (src, options) => {
    rootPath = path.join(process.cwd(), src);
    i18nFile = path.join(process.cwd(), options.path ? options.path : '', `${options.filename}.js`);
    if (options.rootnode) {
        rootNode = options.rootnode;
    }
    initMessage();
    let files = getAllFiles(rootPath);
    files.forEach(item => {
        if (item !== i18nFile) {
            path.extname(item).toLowerCase() === '.vue' ? revertVueFile(item) : revertJsFile(item);
        }
    });
};
