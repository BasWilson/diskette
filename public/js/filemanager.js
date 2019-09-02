let currentpath = [];
let clipboard = [];
let files = [];
let selectMode = false;
let idOfItemWhereContextMenuOpened = -1;
let clipboardAction = null;
let filesToUpload = [];

class File {
    constructor(id, file) {
        this.id = id;
        this.fileName = file.fileName;
        this.isDirectory = file.isDirectory;
        this.fileType = file.fileType;
        this.contextMenu = file.isDirectory ? 'directory' : 'file';
        this.selected = false;
        this.path = GetCurrentPath();
        this.fileSize = file.fileSize;
        this.lastModified = file.lastModified;
    }

    ToggleSelect(override = false, overrideVal = false) {
        if (override)
            this.selected = overrideVal;
        else
            this.selected = !this.selected;

        if (this.selected)
            document.querySelector(`#diskette-item-${this.id}`).classList.add('selected');
        else
            document.querySelector(`#diskette-item-${this.id}`).classList.remove('selected');
    }
}

function LoadFileManager() {

    document.querySelector('.sidebar').style.display = 'block';
    // document.querySelector('#title').innerHTML = `<span class="title-path title-active">diskette</span>/`;
    diskette.innerHTML = `
    <h1 id="title">${GenerateTitleHTML()}</h1>
    <div class="diskette-container" oncontextmenu="OpenContextMenu('blank')">
        <h2 class="disabled">Folders</h2>
        <div id="folders">
        </div>
        <h2 class="disabled">Files</h2>
        <div class="diskette-item inactive file-hints margin-bottom file">
            <p>File type</p>
            <p>Name</p>
            <p>Last modified</p>
            <p>Size</p>
        </div>
        <div id="files">

        </div>

    </div>

    `;

    RequestPathRefresh();
}

function RequestPathRefresh() {
    new ExpressRequest(
        '/retrieve_diskette_listing',
        {
            path: GetCurrentPath(),
            token: localStorage.getItem('token'),
            email: localStorage.getItem('email'),
        },
        RefreshPath
    )
}

function RefreshPath(data) {

    if (data.disk.error) {
        localStorage.removeItem('email');
        localStorage.removeItem('token');
        return TryWithSession();
    } else {
        if (data.auth.token && data.auth.email) {
            localStorage.setItem('email', data.auth.email);
            localStorage.setItem('token', data.auth.token);
        }
    }
    ClearExplorer();

    let filesC = document.querySelector('#files');
    let foldersC = document.querySelector('#folders');

    for (let i = 0; i < data.disk.length; i++) {
        const item = new File(i, data.disk[i]);
        files.push(item)
        let d = new Date();

        if (item.isDirectory) {
            foldersC.innerHTML +=
                `
                <div id="diskette-item-${i}" oncontextmenu="OpenContextMenu(${item.id})" class="diskette-item folder" onclick="ItemInteraction(${item.id})">
                    <p class="big">📁</p>
                    <p>${item.fileName}</p>
                    <div class="divider"></div>
                    <p class="small disabled">${GetLastModified(item.lastModified)}</p>
                </div>
                `
                ;
        } else {

            filesC.innerHTML +=
                `
                <div id="diskette-item-${i}" oncontextmenu="OpenContextMenu(${item.id})" class="diskette-item file" onclick="ItemInteraction(${item.id})">
                    <p>${item.isDirectory ? 'Folder' : item.fileType.toString().replace('.', '').toUpperCase()}</p>
                    <p>${item.fileName}</p>
                    <p>${GetLastModified(item.lastModified)}</p>
                    <p>${FileSizeAbbrevation(item.fileSize)}</p>
                </div>
                `
                ;
        }

    }
}

function ClearExplorer() {
    files = [];
    document.querySelectorAll('.diskette-item').forEach(element => {
        if (!element.classList.contains('file-hints'))
            element.remove();
    });

}

function GetLastModified(timestamp) {

    let milisecondsInADay = 86400000;
    let currentDate = Date.now();
    const differenceInMsBetweenDays = currentDate.toFixed() - timestamp;

    const daysPassedSince = Math.floor(differenceInMsBetweenDays / milisecondsInADay);
    if (daysPassedSince == 0) {
        return 'Today';
    } else if (daysPassedSince == 1) {
        return `Yesterday`;
    } else {
        return `${daysPassedSince} days ago`;
    }

}

function FileSizeAbbrevation(size) {
    if (size < 999 && size < 9999) {
        return `${size} bytes`
    } else if (size > 9999 && size < 99999) {
        return `${(size / 1000)} KB`
    } else if (size > 99999 && size < 99999999) {
        return `${(size / 1000000).toFixed(2)} MB`
    } else if (size > 99999999 && size < 99999e10) {
        return `${(size / 10000e10).toFixed(2)} GB`
    } else if (size > 99999e10 && size < 99999e13) {
        return `${(size / 10000e13).toFixed(2)} TB`
    } else {
        return `${size} bytes`;
    }
}

function ItemInteraction(id) {

    if (selectMode) {
        // Toggle selected state
        files[id].ToggleSelect();

    } else {

        // Normal file selection
        if (files[id].isDirectory == true) {
            currentpath.push(files[id].fileName);
            document.querySelector('#title').innerHTML = GenerateTitleHTML();
            RequestPathRefresh();
        } else if (files[id].isDirectory == false) {
            BuildFilePreview(id);
        }
    }

}

function BuildFilePreview(id) {
    console.log('Building file preview for', GetCurrentPath() + "/" + files[id].filename)
}

function UpdateCurrentPath(indexToNavTo) {
    selectMode = false;
    currentpath.splice(indexToNavTo, (currentpath.length - indexToNavTo));
    document.querySelector('#title').innerHTML = GenerateTitleHTML();
    RequestPathRefresh();
}

function GenerateTitleHTML() {
    let gen = '<span onclick="UpdateCurrentPath(0)" class="title-path">diskette</span>/';

    for (let i = 0; i < currentpath.length; i++) {
        gen += `<span onclick="UpdateCurrentPath('${i + 1}')" class="title-path ${i + 1 == currentpath.length ? 'title-active' : ''}">${currentpath[i]}</span>/`;
    }

    return gen;
}

function GetCurrentPath() {
    let path = currentpath.length == 0 ? '/' : '';
    for (let i = 0; i < currentpath.length; i++) {
        path += '/' + currentpath[i];
    }

    return path;
}

function OpenContainer(container) {
    document.querySelector(`.${container}-container`).style.display = 'block';
    // var picker = document.querySelector('#new-file-upload');
    // simulateClick(picker)
}

// File manager right click menu
window.oncontextmenu = function (id) {
    // if (id.srcElement.classList[0] != 'codeflask__textarea' && id.srcElement.classList[1] != 'codeflask__flatten') {
    return false;     // cancel default menu
    // }
}


let hasRightClicked = false;

function OpenContextMenu(id) {


    if (hasRightClicked) {
        return false;
    }

    hasRightClicked = true;

    var x = event.clientX;
    var y = event.clientY;
    let rightClickMenuHTML = `<div onmouseleave="this.remove()" style="top: ${y}px; left: ${x}px" class="context-menu">`;

    // Reset 
    idOfItemWhereContextMenuOpened = -1;

    // Check what context menu should show
    if (id == 'blank') {
        // The 'click anywhere' context menu
        rightClickMenuHTML += `
        <p onclick="NewFolder()">📁New folder</p>
        <p onclick="CreateUploadContainer()">⚡️New file</p>
        <p onclick="ToggleMultiSelect()">📑Multi select</p>
        <p class="${clipboard.length > 0 ? '' : 'disabled'}" onclick="PasteFromClipboard()">📋Paste</p>
    `;
    } else {

        // Set for use in function such as copy and cut.
        idOfItemWhereContextMenuOpened = id;

        switch (files[id].contextMenu) {
            // Click on a file context menu
            case "file":
                rightClickMenuHTML += `
                <p onclick="ToggleMultiSelect()">📑Multi select</p>
                <p onclick="CopyToClipboard('copy')">📋Copy</p>
                <p onclick="CopyToClipboard('cut')">✂️Move</p>
                <p onclick="Rename()">️️️️️️️✏️Rename</p>
                <p onclick="Compress()">🗂Compress</p>
                ${files[id].fileType == '.zip' ? '<p onclick="Decompress()">🗂Decompress</p>' : ''}
                <p onclick="DeleteItems()">🗑Delete</p>
            `;
                break;
            case "directory":
                rightClickMenuHTML += `
                <p onclick="ToggleMultiSelect()">📑Multi select</p>
                <p onclick="CopyToClipboard('copy')">📋Copy</p>
                <p onclick="CopyToClipboard('cut')">✂️Move</p>
                <p onclick="Rename()">✏️Rename</p>
                <p onclick="Compress()">🗂Compress</p>
                <p onclick="DeleteItems()">🗑Delete</p>
            `;
                break;
            default:
                break;
        }

    }

    rightClickMenuHTML += '</div>';

    document.body.innerHTML += rightClickMenuHTML;

    setTimeout(() => {
        hasRightClicked = false;
    }, 20);

}

function ToggleMultiSelect(override, deselect) {
    CloseContextMenu();
    if (override === undefined)
        selectMode = !selectMode;
    else
        selectMode = override;

    if (!selectMode && deselect) {
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            if (file.selected)
                file.ToggleSelect();
        }
    }
}

function CloseContextMenu() {
    if (document.querySelector('.context-menu'))
        document.querySelector('.context-menu').remove();
}
function CopyToClipboard(action) {

    CloseContextMenu();

    // Empty clipboard
    clipboard = [];

    // Set the clipboard action for when the paste function is called
    clipboardAction = action;

    // Check if in select mode, if so add all selected items to clipboard
    if (selectMode)
        ToggleMultiSelect();

    for (let i = 0; i < files.length; i++) {
        if (files[i].selected || files[i].id == idOfItemWhereContextMenuOpened) {
            clipboard.push(files[i]);
            files[i].ToggleSelect();
        }

    }

    if (clipboard.length == 0)
        return;

    notification(`${action == 'copy' ? 'Copied' : 'Cut'} ${clipboard.length} ${clipboard.length > 1 ? 'files' : 'file'} to clipboard.`, 6000)

    // Added to clipboard
    console.log('Added to clipboard:', clipboard)
}

function PasteFromClipboard() {
    if (clipboard.length == 0)
        return;

    CloseContextMenu();

    notification(`${clipboardAction == 'copy' ? 'Copying' : 'Moving'} ${clipboard.length} ${clipboard.length == 1 ? 'file' : 'files'} to ${GetCurrentPath()}`, 6000)

    // Make the request to the diskette server
    new ExpressRequest(
        '/diskette_paste',
        {
            pasteTo: GetCurrentPath(),
            clipboardAction: clipboardAction,
            clipboard: clipboard,
            email: localStorage.getItem('email'),
            token: localStorage.getItem('token')
        },
        RequestPathRefresh
    )

    console.log('Requested to paste from clipboard to', GetCurrentPath());
}

function DeleteItems() {

    CloseContextMenu();
    let itemsToDelete = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.selected || file.id == idOfItemWhereContextMenuOpened)
            itemsToDelete.push(file);
    }

    const confirmd = confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`);

    if (confirmd) {
        // Make the request to the diskette server
        new ExpressRequest(
            '/diskette_delete',
            {
                items: itemsToDelete,
                email: localStorage.getItem('email'),
                token: localStorage.getItem('token')
            },
            RequestPathRefresh
        )

        notification(`Deleting ${itemsToDelete.length} ${itemsToDelete.length == 1 ? 'file' : 'files'}.`)
        console.log('Requested to delete selected items');
    }

}

function NewFolder() {

    CloseContextMenu();

    let name = prompt('Folder name');

    if (name.length == 0)
        return;

    // Make the request to the diskette server
    new ExpressRequest(
        '/diskette_newfolder',
        {
            path: GetCurrentPath(),
            folderName: name,
            email: localStorage.getItem('email'),
            token: localStorage.getItem('token')
        },
        RequestPathRefresh
    )

    console.log('Requested to create new folder');
}


function Rename() {


    CloseContextMenu();

    let newName = prompt('Rename to what?', files[idOfItemWhereContextMenuOpened].fileName);

    if (!newName) return;
    // Make the request to the diskette server
    new ExpressRequest(
        '/diskette_rename',
        {
            file: files[idOfItemWhereContextMenuOpened],
            newName: newName,
            email: localStorage.getItem('email'),
            token: localStorage.getItem('token')
        },
        RequestPathRefresh
    )

    console.log('Requested to rename');
}

window.onscroll = ((e) => {
    document.querySelector('.sidebar').style.margin = `${(10 + scrollY)}px 10px 10px 10px`;
})

window.addEventListener('keydown', (event) => {
    if (event.keyCode == 67 && event.metaKey == true || event.ctrlKey == true) {
        // Copy
        CopyToClipboard('copy');
    } else if (event.keyCode == 86 && event.metaKey == true || event.ctrlKey == true) {
        // Paste
        PasteFromClipboard()
    } else if (event.keyCode == 88 && event.metaKey == true || event.ctrlKey == true) {
        // Cut
        CopyToClipboard('cut');
    } else if (event.keyCode == 91 && event.metaKey == true || event.ctrlKey == true) {
        // Control or cmd key, for multiselecting
        ToggleMultiSelect(true, false);
    } else if (event.keyCode == 8 && event.metaKey == true || event.ctrlKey == true) {
        // Backspace with ctrl or cmd
        DeleteItems();
    } else if (event.keyCode == 70 && event.metaKey == true || event.ctrlKey == true) {
        // F with ctrl or cmd, compressing
        Compress();
    } else if (event.keyCode == 65 && event.metaKey == true || event.ctrlKey == true) {
        // A with ctrl or cmd, select all
        ToggleAllFiles(true);
    } else if (event.keyCode == 68 && event.metaKey == true || event.ctrlKey == true) {
        // D with ctrl or cmd, select all
        ToggleAllFiles(false);
    }
})

window.addEventListener('keyup', (event) => {
    if (event.keyCode == 91 && event.metaKey == false || event.ctrlKey == false) {
        // Control or cmd key, for multiselecting
        ToggleMultiSelect(false, false);
    }
})

function PrepareFileUpload() {
    let files = document.querySelector('#file').files;
    let filesContainer = document.querySelector('#files-to-upload');
    filesContainer.innerHTML = '';

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        filesToUpload.push(file);
        filesContainer.innerHTML += `
        <div id="diskette-upload-item-${i}" class="diskette-upload-item file" onclick="RemoveFileFromUploads(${i})">
            <p>${file.name}</p>
            <p>${FileSizeAbbrevation(file.size)}</p>
        </div>
        `;
    }

    if (files.length > 0) {
        document.querySelector('#upload-btn').style.display = 'block';
    }
}

function RemoveFileFromUploads(id) {
    document.querySelector('#diskette-upload-item-' + id).remove();
    filesToUpload.splice(id, 1);
}

function StartFileUpload() {

    if (filesToUpload.length > 0) {
        new ExpressRequest(
            '/diskette_upload',
            {
                path: GetCurrentPath(),
                email: localStorage.getItem('email'),
                token: localStorage.getItem('token')
            },
            RequestPathRefresh,
            filesToUpload
        );

        filesToUpload = [];

        alert('Your files are being uploaded, this might take a while. We will refresh your diskette once done.');

        if (document.querySelector('.upload-container'))
            document.querySelector('.upload-container').remove();

    }

}

function CreateUploadContainer() {

    CloseContextMenu();

    if (document.querySelector('.upload-container'))
        document.querySelector('.upload-container').remove();

    document.body.innerHTML += `
    <div class="upload-container">
        <div class="upload-inner">

            <!-- Buttons -->
            <p class="button" style="position: absolute; right: 20px; bottom: 15px;"
                onclick="document.querySelector('.upload-container').remove()">Close</p>
            <p class="button" style="position: absolute; left: 20px; bottom: 15px;"
                onclick="simulateClick(document.querySelector('#file'));">Add file(s) from device
            </p>
            <p class="button" id="upload-btn" style="position: absolute; left: 265px; bottom: 15px; display: none;"
                onclick="StartFileUpload();">Start upload
            </p>
            <!-- End buttons -->

            <!-- Header -->
            <p class="big">New file</p>
            <div class="divider-s"></div>
            <p class="small disabled">Upload new files from your device to save to your diskette.</p>
            <div class="divider"></div>
            <!-- End header -->

            <!-- Hidden elements -->
            <input type="file" name="sample_file" style="display: none;" multiple="true" id="file" />
            <!-- End hidden elements -->

            <p class="disabled">Selected files</p>
            <div class="divider-s"></div>
            <p class="small disabled">Click to remove a file.</p>
            <div class="divider"></div>
            <div id="files-to-upload">
                <p>No files selected</p>
            </div>

        </div>
    </div>
    `;

    // Listen for a change of files
    document.querySelector('#file').onchange = (e) => {
        PrepareFileUpload();
    }
}

function Compress() {
    CloseContextMenu();

    let itemsToCompress = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.selected || file.id == idOfItemWhereContextMenuOpened) {
            console.log('selected')
            itemsToCompress.push(file);
        }
    }

    const confirmd = confirm(`Are you sure you want to compress ${itemsToCompress.length} item(s)?`);

    if (confirmd) {
        // Make the request to the diskette server
        new ExpressRequest(
            '/diskette_compress',
            {
                items: itemsToCompress,
                email: localStorage.getItem('email'),
                token: localStorage.getItem('token')
            },
            RequestPathRefresh
        )

        notification(`Compressing ${itemsToCompress.length} ${itemsToCompress.length == 1 ? 'file' : 'files'}.`)
        console.log('Requested to compress selected items');
    }
}

function Decompress() {
    CloseContextMenu();

    let itemsToDecompress = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.fileType != '.zip')
            continue;

        if (file.selected || file.id == idOfItemWhereContextMenuOpened)
            itemsToDecompress.push(file);
    }

    const confirmd = confirm(`Are you sure you want to decompress ${itemsToDecompress.length} item(s)?`);

    if (confirmd) {
        // Make the request to the diskette server
        new ExpressRequest(
            '/diskette_decompress',
            {
                items: itemsToDecompress,
                email: localStorage.getItem('email'),
                token: localStorage.getItem('token')
            },
            RequestPathRefresh
        )

        notification(`decompress ${itemsToDecompress.length} ${itemsToDecompress.length == 1 ? 'file' : 'files'}.`)
        console.log('Requested to decompress selected items');
    }
}

function ToggleAllFiles(selected) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        file.ToggleSelect(selected, selected);
    }
}