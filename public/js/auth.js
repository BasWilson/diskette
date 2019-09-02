function LoadSignIn () {
    document.querySelector('.sidebar').style.display = 'none';

    document.querySelector('.diskette').innerHTML = `
    <div class="auth-container">
        <h1 id="title"><span class="title-path">diskette</span>/authenticate</h1>
        <form>
        <input type="email" placeholder="Email" id="email-field" class="auth-item">
        <input type="password" placeholder="Password" id="password-field" class="auth-item">
        </form>

        <div class="divider"></div>
        <p class="center disabled">By using diskette you agree to the <strong>terms of service</strong>.</p>
        <div class="divider"></div>
        <button class="button" onclick="Authenticate('login')">Log in</button>
        <div class="divider-s"></div>
        <p class="center disabled">or</p>
        <div class="divider-s"></div>
        <button class="button" onclick="Authenticate('register')">Sign up</button>
    </div>
    `;
}

function Authenticate(action) {

    const email = document.querySelector('#email-field').value;
    const password = document.querySelector('#password-field').value;

    if (!email || !password)
        return notification('Please enter all fields', 5000);

    new ExpressRequest(
        '/diskette_' + action,
        {
            password: password,
            email: email
        },
        AuthenticateCallback
    );
    
}

function AuthenticateCallback (result) {

    if (result.error) {
        alert(result.error);
        localStorage.removeItem('email')
        localStorage.removeItem('token')
    }

    if (result.token && result.email) {
        localStorage.setItem('email', result.email);
        localStorage.setItem('token', result.token);
    }

    TryWithSession();

}

function TryWithSession() {

    // Theres a session saved, try to load file manager
    if (localStorage.getItem('email') && localStorage.getItem('token')) {
        LoadFileManager();
    }  else {
        LoadSignIn();
    }

}

TryWithSession();