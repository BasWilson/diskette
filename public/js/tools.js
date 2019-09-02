class ExpressRequest {
    constructor(url, data, callback, files = []) {
        this.url = url;
        this.data = data;
        this.callback = callback;
        this.files = files;
        this.send()
    }

    send() {
        var expReq = this;
        var formData = new FormData();

        // Append data
        formData.append("data", JSON.stringify(this.data));

        // Set the length of files array
        formData.append("filesLength", this.files.length);

        // Add all the files
        for (let i = 0; i < this.files.length; i++) {
            formData.append('file_' + i, this.files[i]);
        }

        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function () {
            if (typeof this.responseText == 'undefined') return false;

            if (this.readyState == 4 && this.status == 200) {
                var response = JSON.parse(this.responseText);
                expReq.callback(response);
            }

        };

        xhttp.open("POST", this.url, true);
        xhttp.send(formData);
    }
}

let diskette = document.querySelector('.diskette');
let title = document.querySelector('#title');
let version = '0.0.3b';

document.querySelector('.version').innerHTML = 'diskette Web App v'+ version;

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});

Date.prototype.toHHMM = (function() {
    var local = new Date(this);

    var minutes = local.getMinutes();
    var hours = local.getHours();

    if (minutes.toString().length == 1)
        minutes = "0" + minutes;

    if (hours.toString().length == 1)
        hours = "0" + hours;

    return hours + ":" + minutes;
});

function getBase64(file) {
    return new Promise(resolve => {
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
          return resolve(reader.result);
        };
        reader.onerror = function (error) {
          console.log('Error: ', error);
        };
    });

 }

 /**
 * Simulate a click event.
 * @public
 * @param {Element} elem  the element to simulate a click on
 */
var simulateClick = function (elem) {
	// Create our event (with options)
	var evt = new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		view: window
	});
	// If cancelled, don't dispatch our event
	var canceled = !elem.dispatchEvent(evt);
};

function convertDateForIos(date) {
    var arr = date.split(/[- :]/);
    date = new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]);
    return date;
}


function SetTitle(string) {
    title.innerHTML = string;
}

function notification (text, length) {
    new NotifyJS(
        {
            duration: length,
            message: text // Message
        },
        {
            customCSSBox: 'border: 2px solid blueviolet; border-radius: 5px; background-color: white; color: black !important;',
            color: 'white !important',
            textColor: 'black',
        }
    )
}