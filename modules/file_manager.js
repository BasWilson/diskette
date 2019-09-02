module.exports = {
    GetDisketteHierachy: GetDisketteHierachy,
    CreateUserDiskette: CreateUserDiskette,
    Paste: Paste,
    Delete: Delete,
    NewFolder: NewFolder,
    Rename: Rename,
    Compress: Compress,
    Decompress: Decompress
};

const authentication = require('./authentication.js');
const fs = require('fs-extra');
const pathFS = require('path');
const zlib = require('zlib');
const AdmZip = require('adm-zip');

/**
 * Get hierarchy for any path on a user's diskette
 * @param {User} user 
 * @param {Text} path 
 */
function GetDisketteHierachy(user, path) {
    return new Promise(resolve => {
        if (user) {
            //  Try to match illegal paths
            // if (path.match(/..\//g)) {
            //     return resolve("Illegal path entered");
            // }

            try {
                const items = fs.readdirSync(`${UserPath(user)}${path}`);
                let hierarchy = [];
                for (let i = 0; i < items.length; i++) {
                    const file = `${UserPath(user)}${path}` + "/" + items[i];

                    if (CheckForbiddenFileType(file)) {
                        if (items[i] != '.DS_Store') {
                            const stat = IsDir(file);

                            hierarchy.push({
                                'isDirectory': stat.isDirectory(),
                                'fileType': pathFS.extname(file),
                                'fileName': items[i],
                                'fileSize': stat.size,
                                'lastModified': stat.atimeMs
                            });
                        }
                    }

                }
                return resolve(hierarchy.sort());

            } catch (error) {
                HandleErrorCode(error.errno).then((message) => {
                    return resolve(message);
                });
            }
        } else {
            return resolve({ error: "User is not authenticated" });
        }

    });

}

/**
 * Create a directory at a given path
 * @param {Text} path 
 * @param {Text} dirName 
 */
function CreateDirectory(path, dirName) {
    return new Promise(resolve => {
        // Check if we can create a new folder
        fs.pathExists(`${path}/${dirName}`).then((exists) => {
            if (exists)
                return resolve(false);

            // Create the directory
            fs.mkdirp(`${path}/${dirName}`).then(() => {
                return resolve(true);
            }).catch((err) => {
                console.error(err);
                return resolve(false);
            })
        }).catch((err) => {
            console.error(err);
            return resolve(false);
        })

    });
}

function NewFolder(path, folderName, user) {
    return new Promise(resolve => {
        if (!path)
            path = '/';

        CreateDirectory(`${UserPath(user)}${path}`, folderName).then((created) => {
            return resolve(created);
        });
    });
}

function Rename(file, newName, user) {
    return new Promise(resolve => {

        let renamedPath = `${UserPath(user)}${file.path}/${newName}`;
        if (newName == file.fileName)
            return resolve(false);

        fs.pathExists(renamedPath)
            .then(exists => {
                if (exists) {
                    renamedPath = `${UserPath(user)}${file.path}/Renamed_${newName}`;
                }
                fs.renameSync(`${UserPath(user)}${file.path}/${file.fileName}`, renamedPath);
                return resolve(true);
            }).catch((err) => {
                console.error(err)
                return resolve(false);
            });

    });
}

function Paste(pasteTo, clipboardAction, clipboard, user, upload = false) {
    return new Promise(resolve => {

        if (!pasteTo || !clipboardAction || clipboard.length == 0 || !user)
            return resolve(false);

        for (let i = 0; i < clipboard.length; i++) {

            const file = clipboard[i];

            // Check if it is an upload or a normal paste operation
            const srcpath = upload ? `${file.path}` : `${UserPath(user)}${file.path}/${file.fileName}`;
            let dstpath = upload ? `${UserPath(user)}${pasteTo}/${file.name}` : `${UserPath(user)}${pasteTo}/${file.fileName}`;

            fs.pathExists(dstpath)
                .then(exists => {
                    if (exists) {
                        dstpath = upload ? `${UserPath(user)}${pasteTo}/Copy of ${file.name}` : `${UserPath(user)}${pasteTo}/Copy of ${file.fileName}`;
                    }

                    if (clipboardAction == 'cut') {

                        fs.move(srcpath, dstpath)
                            .then(() => {
                                console.log('moved succesfully!')
                            })
                            .catch(err => {
                                console.error(err)
                                return resolve(false);
                            })
                    } else if (clipboardAction == 'copy') {
                        fs.copy(srcpath, dstpath).then(() => {
                            console.log('copied succesfully')
                        }).catch((err) => {
                            console.log(err)
                            return resolve(false);
                        });
                    }

                }).catch(err => {
                    console.log(err)
                    return resolve(false);
                });
        }

        // Paste function ended in success
        return resolve(true);

    });
}

function Delete(items, user) {
    return new Promise(resolve => {

        if (items.length == 0 || !user)
            return resolve(false);

        for (let i = 0; i < items.length; i++) {
            const file = items[i];
            console.log('Deleting', `${UserPath(user)}${file.path}/${file.fileName}`);
            fs.remove(`${UserPath(user)}${file.path}/${file.fileName}`)
                .then(() => {
                    console.log('deleted with success!')
                    resolve(true);
                })
                .catch(err => {
                    console.log(err)
                    return resolve(false);
                })
        }


    });

}

function Compress(filesToZip, user) {
    return new Promise(resolve => {

        if (!user)
            return resolve(false);

        let zip = new AdmZip();

        for (let i = 0; i < filesToZip.length; i++) {
            const file = filesToZip[i];
            const pathOfFile = `${UserPath(user)}${file.path}${file.fileName}`;

            if (IsDir(pathOfFile).isDirectory()) {
                zip.addLocalFolder(pathOfFile);
            }
            else {
                zip.addLocalFile(pathOfFile);
            }

        }

        console.log('Zipped file to', `${UserPath(user)}${filesToZip[0].path}/${filesToZip[0].fileName.replace(filesToZip[0].fileType, '')}.zip`)
        zip.writeZip(`${UserPath(user)}${filesToZip[0].path}/${filesToZip[0].fileName.replace(filesToZip[0].fileType, '')}.zip`);

        return resolve(true);
    });
}

function Decompress(filesToUnzip, user) {

    return new Promise(resolve => {

        if (!user)
            return resolve(false);

        for (let i = 0; i < filesToUnzip.length; i++) {
            const file = filesToUnzip[i];
            let zip = new AdmZip(`${UserPath(user)}${file.path}/${file.fileName}`);

            const newDir = `${UserPath(user)}${file.path}/${file.fileName.replace('.zip', ' Decompressed')}`;

            fs.ensureDir(newDir).then((created) => {
                if (created)
                    zip.extractAllTo(newDir);
            });
        }

        return resolve(true);

    });

}

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

/**
 * Checks if a path is a directory
 * @param {Text} path 
 */
function IsDir(path) {
    try {
        var stat = fs.lstatSync(path);
        return stat;
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }

}

/**
 * Create a new diskette for a user
 * @param {User} user 
 */
function CreateUserDiskette(user) {
    return new Promise(resolve => {
        fs.pathExists(UserPath(user)).then((exists) => {
            if (!exists) {
                CreateDirectory('./user_diskettes', user.email).then((created) => {
                    CreateDirectory('./user_bins', user.email).then((created) => {
                        return resolve(created);
                    });
                });
            } else {
                return resolve(false);
            }

        });

    });
}

/**
 * Handle diskette error codes
 * @param {*} error 
 */
function HandleErrorCode(error) {
    return new Promise(resolve => {
        switch (error) {
            case -2:
                resolve("Directory does not exist");
                break;

            default:
                resolve("An unknown error occurred");
                break;
        }
    });
}

/**
 * Returns a user's root diskette path
 * @param {User} user 
 */
function UserPath(user) {
    return `./user_diskettes/${user.email}`;
}

function CheckForbiddenFileType(file) {
    const types = ['.DS_Store']
    const fileType = pathFS.extname(file);
    for (let i = 0; i < types.length; i++) {
        if (fileType == types[i]) {
            return false;
        }
    }

    return true;
}
