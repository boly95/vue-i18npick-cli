#!/usr/bin/env node
require('colors');
const packageInfo = require('../package.json');
const program = require('commander');
const generateFile = require('../lib/generate');
const revertFile = require('../lib/revert');

program.version(packageInfo.version, '-v, --version');
program.command('generate [src]')
    .description('对src目录下的vue/js文件进行国际化替换生成, 默认src为执行目录下的src目录')
    .option('-k, --key <key>', '自定义key前缀，默认为相对执行目录的文件路径')
    .option('-s, --single', '是否为单文件index序列，默认为全局序列，当自定义key之后，此设置无效')
    .option('-p, --path <path>', '设置生成文件的路径，默认为运行目录（请设置已经存在的目录！！！）')
    .option('-f, --filename <filename>', '设置生成文件名，默认为zh_cn')
    .action((src = 'src', {key, single, path, filename = 'zh_cn'}) => {
        generateFile.generate(src, {key, single, path, filename});
    });
program.command('revert [src]')
    .description('对src目录下的vue/js文件进行国际化还原，默认src为执行目录下的src目录')
    .option('-p, --path <path>', '设置国际化文件路径，默认为运行目录')
    .option('-f, --filename <filename>', '设置国际化文件名，默认为zh_cn')
    .option('-r, --rootnode <rootnode>', '设置国际化文件根节点，默认为空，即第一层，有的国际国际化文件整合为一个的，可以设置，比如 messages.zh_cn')
    .action((src = 'src', {path, filename = 'zh_cn', rootnode}) => {
        revertFile.revert(src, {path, filename, rootnode});
    });
program.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
});
if (process.argv.length === 2) {
    program.help();
}

program.parse(process.argv);
