import path from 'path';
import { argv } from 'process';
import { existsSync, readFileSync, lstatSync, opendirSync } from 'fs';

path.basename(process.cwd());

if (argv.length != 3) {
    console.log('Invalid argument');
    console.log(argv);
    process.exit(1);
}

if (argv[2] == '--help') {
    console.log('Usage: node index.js <path>');
    process.exit(0);
}

if (existsSync(argv[2]) && isDirectory(argv[2])) {
    console.log('Working on: ' + argv[2]);
    const found = getUsedI18nKeys(argv[2]);
    console.log('Map:');
    console.log(found);
    console.log('Keys:');
    const keys = Object.keys(found);
    keys.forEach(key => {console.log(key);});
    console.log('Count: ' + Object.keys(found).length);
} else {
    console.log('path not found: ' + argv[2]);
    process.exit(1);
}

/**
 * Extract all the i18n keys from the directory tree.
 * Useful to find unused keys and to find where the keys are used.
 * @param {string} directory Directory to scan. If none is provided, the current directory is used.
 * @param {object} ignoreDirectories Optional. List of directories to ignore. For example: {'node_modules': true, 'bower_components': true}
 * @returns Object with the keys found. Example: {'key1': ['file1', 'file2'], 'key2': ['file3']}
 */
export function getUsedI18nKeys(directory, ignoreDirectories) {
    const re = /[\.\$][tT]\(([\'\"])([^\'\"]*)\1\)/g;
    const labels = {};

    if(!directory)
        directory = process.cwd();

    if(!ignoreDirectories) {
        ignoreDirectories = {
            'node_modules': true,
            'bower_components': true,
            'dist': true,
            'build': true,
            'lib': true,
            'libs': true,
            'assets': true,
            'assets-dev': true,
            'assets-prod': true,
        };
    }

    function processPathRecursively(dirPath) {
        if (ignoreDirectories[path.basename(dirPath)]) {
            return;
        }
        let files = readdirSync(dirPath);
        files.forEach(file => {
            let filePath = path.join(dirPath, file);
            if (existsSync(filePath)) {
                if (isDirectory(filePath)) {
                    processPathRecursively(filePath);
                } else {
                    processFile(filePath);
                }
            }
        });
    }

    function processFile(filePath) {
        let fileContent = readFileSync(filePath, 'utf8');
        if (!isFileBinary(fileContent)) {
            let i18nKeys = fileContent.match(re);
            i18nKeys = i18nKeys ? i18nKeys.map(x => x.replace(re, '$2')) : [];
            i18nKeys.forEach(key => {
                labels[key] = labels[key] ? labels[key] : [];
                labels[key].push(filePath);
            });
        }
    }

    processPathRecursively(directory);
    
    return labels;
}

function isDirectory(filePath) {
    return lstatSync(filePath).isDirectory();
}

function readdirSync(dirPath) {
    let files = [];
    let dir = opendirSync(dirPath);
    let dirent;
    while ((dirent = dir.readSync()) !== null) {
        files.push(dirent.name);
    }
    dir.closeSync();
    return files;
}

function isFileBinary(fileContent) {
    return fileContent.indexOf('\u0000') != -1;
}