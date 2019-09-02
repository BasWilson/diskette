module.exports = {
    User: ReturnUserClass,
    CreateNewUser: CreateNewUser,
    Authenticate: Authenticate,
    LogIn: LogIn
};

const fm = require('./file_manager');

let users = [
    {
        email: "bas@gmail.com",
        password: "test",
        token: ""
    }
];

class User {
    constructor(email, password) {
        this.email = email;
        this.password = password;
        this.token = this.Token();
    }

    Token() {
        this.token = RetrieveToken(this);
    }

}

function ReturnUserClass(email, password) {
    if (email && password)
        return new User(email, password);
    else
        return false;
}

/**
 * Gets the user's token
 * @param {User} user 
 */
function RetrieveToken(user) {
    if (user) {

        // Return the token
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (u.email == user.email && u.password == user.password)
                return u.token;
        }

        return false;
    } else {
        return false;
    }
}

/**
 * Create a new user for the drive, returns a user object if created, returns false if not created
 * @param {User} newUser 
 */
function CreateNewUser(newUser) {
    return new Promise(resolve => {
        // Check if user class is all good
        if (newUser) {

            // Check if email is in use
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                if (user.email == newUser.email)
                    return resolve(false);
            }

            // Email is new, create user
            users.push(newUser);

            // Create a drive for the user
            fm.CreateUserDiskette(newUser).then((created) => {
                if (created)
                    return resolve(newUser);
            }).catch((err) => {
                console.error(err)
                return resolve(false);
            });
        } else {
            return resolve(false);
        }
    });
}

/**
 * Used to authenticate an user account when performing an action.
 * @param {User} user 
 */
function Authenticate(user) {
    return new Promise(resolve => {
        if (user) {
            // Check if the token is valid
            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                if (u.token == user.token && u.email == user.email)
                    return resolve(u);
            }

            return resolve(false);
        } else {
            return resolve(false);
        }

    });
}

/**
 * Used to log in an user account and create a new token.
 * @param {User} user 
 */
function LogIn(user) {
    return new Promise(resolve => {

        if (user) {
            // Check if email and password are valid
            for (let i = 0; i < users.length; i++) {
                const u = users[i];
                if (u.email == user.email && u.password == user.password) {

                    // Generate new token for the user
                    users[i].token = GenerateNewToken();
                    return resolve(users[i]);
                }
            }

            return resolve(false);
        } else {
            return resolve(false);
        }

    });
}

function GenerateNewToken() {
    return "xxxxxxxxxxxxxxxx";
}

// let user = ReturnUserClass("test@gmail.com", "test");
// CreateNewUser(user);
// user = LogIn(user)
// console.log(Authenticate(user))
// console.log(users)
