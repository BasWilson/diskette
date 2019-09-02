let currentpath = [];
let clipboard = [];
let files = [];
let selectMode = false;
let idOfItemWhereContextMenuOpened = -1;
let clipboardAction = null;

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

    ToggleSelect() {
        this.selected = !this.selected;
        if (this.selected)
            document.querySelector(`#diskette-item-${this.id}`).classList.add('selected');
        else
            document.querySelector(`#diskette-item-${this.id}`).classList.remove('selected');
    }
}

function LoadFileManager() {

    // document.querySelector('#title').innerHTML = `<span class="title-path title-active">diskette</span>/`;
    diskette.innerHTML = `
    <h1 id="title">${GenerateTitleHTML()}</h1>
    <div class="diskette-container" oncontextmenu="OpenContextMenu('blank')">
        <h1 class="disabled">Folders</h1>
        <div id="folders">
        </div>
        <h1 class="disabled">Files</h1>
        <div id="files">
            <div class="diskette-item inactive file-hints margin-bottom">
            <p>File type</p>
            <p>Name</p>
            <p>Last modified</p>
            <p>Size</p>
        </div>
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
            email: 'wilson@gmail.com'
        },
        RefreshPath
    )
}

function RefreshPath(data) {

    ClearExplorer();

    let filesC = document.querySelector('#files');
    let foldersC = document.querySelector('#folders');

    for (let i = 0; i < data.length; i++) {
        const item = new File(i, data[i]);
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
    if (size < 999) {
        return `${size} bytes`
    } else if (size > 9999 && size < 99999) {
        return `${(size / 1000)} KB`
    } else if (size > 99999 && size < 99999999) {
        return `${(size / 1000000).toFixed(2)} MB`
    } else if (size > 99999999 && size < 99999e10) {
        return `${(size / 10000e10).toFixed(2)} GB`
    } else if (size > 99999e10 && size < 99999e13) {
        return `${(size / 10000e13).toFixed(2)} TB`
    }
}

LoadFileManager();

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

function OpenUploadContainer() {
    document.querySelector('.upload-container').style.display = 'block';
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


    console.log('Opening context menu')

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
        <p onclick="ToggleMultiSelect()">📑Multi select</p>
        <p class="${clipboard.length > 0 ? '' : 'disabled'}" onclick="PasteFromClipboard()">📋Paste</p>
        <p>⚡️Upload a file</p>
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
                <p onclick="CopyToClipboard('cut')">✂️Cut</p>
                <p onclick="Rename()">️️️️️️️✏️Rename</p>
                <p onclick="DeleteItems()">🗑Delete</p>
            `;
                break;
            case "directory":
                rightClickMenuHTML += `
                <p onclick="ToggleMultiSelect()">📑Multi select</p>
                <p onclick="CopyToClipboard('copy')">📋Copy</p>
                <p onclick="CopyToClipboard('cut')">✂️Cut</p>
                <p onclick="Rename()">✏️Rename</p>
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

function ToggleMultiSelect() {
    CloseContextMenu();
    selectMode = !selectMode;

    if (!selectMode) {
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
    if (selectMode) {
        for (let i = 0; i < files.length; i++) {
            if (files[i].selected) {
                clipboard.push(files[i]);
                files[i].ToggleSelect();
            }
        }

        ToggleMultiSelect();
    } else {
        clipboard.push(files[idOfItemWhereContextMenuOpened]);
    }

    // Added to clipboard
    console.log('Added to clipboard:', clipboard)
}

function PasteFromClipboard() {
    if (clipboard.length == 0)
        return;

    CloseContextMenu();

    // Make the request to the diskette server
    new ExpressRequest(
        '/diskette_paste',
        {
            pasteTo: GetCurrentPath(),
            clipboardAction: clipboardAction,
            clipboard: clipboard,
            email: 'wilson@gmail.com'
        },
        RequestPathRefresh
    )

    console.log('Requested to paste from clipboard to', GetCurrentPath());
}

function DeleteItems() {

    CloseContextMenu();
    let itemsToDelete = [];

    // If select mode is enabled, delete all items that are selected
    if (selectMode) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.selected)
                itemsToDelete.push(file);
        }
    } else {
        // Delete only item where context menu opened
        itemsToDelete.push(files[idOfItemWhereContextMenuOpened]);
    }

    const confirmd = confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`);

    if (confirmd) {
        // Make the request to the diskette server
        new ExpressRequest(
            '/diskette_delete',
            {
                items: itemsToDelete,
                email: 'wilson@gmail.com'
            },
            RequestPathRefresh
        )

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
            email: 'wilson@gmail.com'
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
            email: 'wilson@gmail.com'
        },
        RequestPathRefresh
    )

    console.log('Requested to rename');
}