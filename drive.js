// Custom modules
const fm = require("./modules/file_manager");
const authentication = require("./modules/authentication");

// Express app
const express = require('express');
// const cors = require('cors');
const formidableMiddleware = require('express-formidable');
const path = require('path');
const port = 4000;
const app = express();
const fileUpload = require('express-fileupload');

// Middleware
app.use(formidableMiddleware());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(fileUpload())
// app.use(cors());


// Post functions

app.post('/diskette_login', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    // Get a user object
    let user = authentication.User(parsedJson.email, parsedJson.password);

    if (!user)
        return res.send({ error: 'Please enter all fields.' });

    // Log user in
    authentication.LogIn(user).then((authenticatedUser) => {
        if (authenticatedUser) {
            user = authenticatedUser;
            res.send({
                email: user.email,
                token: user.token
            });
        } else {
            res.send({ error: "Your log in details are incorrect. Please try again." });
        }
    });
});

app.post('/diskette_register', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    // Get a user object
    let user = authentication.User(parsedJson.email, parsedJson.password);

    // Check if user is valid
    if (!user)
        return res.send({ error: 'Please enter all fields.' });

    // Register the user
    authentication.CreateNewUser(user).then((newUser) => {
        if (newUser != false) {
            user = newUser;

            // Create a session for the user and send them their details
            authentication.LogIn(user).then((authenticatedUser) => {
                if (authenticatedUser) {
                    user = authenticatedUser;
                    res.send({
                        email: user.email,
                        token: user.token
                    });
                } else {
                    res.send({ error: "We could not create your user session, please try again. Please try again." });
                }
            });
        } else {
            res.send({ error: "The email you provided is already in use. Please try again." });
        }
    });
});

app.post('/retrieve_diskette_listing', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    // Get user object
    let user = authentication.User(parsedJson.email, 'fake');

    // Set the user object token
    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });

    // Authenticate the user
    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.GetDisketteHierachy(authenticatedUser, parsedJson.path).then((diskette) => {
            res.send({ disk: diskette, auth: { token: authenticatedUser.token, email: authenticatedUser.email } });
        }).catch((err) => {
            console.error(err)
            res.send({ error: 'Could not retrieve user\'s diskette.' });
        });
    });

});

app.post('/diskette_paste', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });

    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.Paste(parsedJson.pasteTo, parsedJson.clipboardAction, parsedJson.clipboard, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not complete paste operation.' });
        });
    });



});

app.post('/diskette_delete', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });


    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.Delete(parsedJson.items, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not complete delete operation.' });
        });
    });

});

app.post('/diskette_newfolder', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });

    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.NewFolder(parsedJson.path, parsedJson.folderName, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not create new folder.' });
        });
    });

});

app.post('/diskette_rename', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });


    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.Rename(parsedJson.file, parsedJson.newName, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not rename file/folder.' });
        });
    });


});

app.post('/diskette_upload', function (req, res) {

    const parsedJson = JSON.parse(req.fields.data);

    console.log('Uploading');

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });

    authentication.Authenticate(user).then((authenticatedUser) => {

        let successCount = 0;
        const filesLength = req.fields.filesLength;
        let uploadQue = [];

        for (let i = 0; i < filesLength; i++) {
            const file = req.files['file_' + i]

            if (file) {
                uploadQue.push(file);
                console.log('added to upload que: ', file.name)
            }

        }

        fm.Paste(parsedJson.path, 'cut', uploadQue, authenticatedUser, true).then((moved) => {
            if (!moved) {
                console.log('Could not move')
                return res.send({ error: 'Could not upload a file: ' + file.name });
            }
            else {
                console.log('Moved file')
                successCount++;
            }

        }).catch((err) => {
            console.error(err)
            return res.send({ error: 'Could not upload a file: ' + file.name });
        })

        if (successCount == filesLength) {
            console.log('All is uploaded')
            res.send(true);
        } else {
            res.send({ error: 'Could not upload all files' });
        }
    });


});

app.post('/diskette_compress', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });


    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.Compress(parsedJson.items, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not complete delete operation.' });
        });
    });

});

app.post('/diskette_decompress', (req, res) => {
    const parsedJson = JSON.parse(req.fields.data);

    let user = authentication.User(parsedJson.email, "fake");

    user.token = parsedJson.token ? parsedJson.token : 0;

    if (!user)
        return res.send({ error: 'Please log in again.' });

    authentication.Authenticate(user).then((authenticatedUser) => {
        fm.Decompress(parsedJson.items, authenticatedUser).then((result) => {
            if (result === true)
                res.send(true);
            else
                res.send({ error: 'Could not complete decompression operation.' });
        });
    });

});

app.listen(port, () => {
    console.log(`App listening on port ${port}!`);
});

// Temp webserver
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
});

// // Test functions
// let user = authentication.User("wilson@gmail.com", "test");
// authentication.CreateNewUser(user);
// user = authentication.LogIn(user);

// fm.GetdisketteHierachy(user, '').then((res) => {
//     console.log(res);
// }).catch((err) => {
//     console.log(err)
// })