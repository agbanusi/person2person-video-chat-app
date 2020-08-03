window.addEventListener('load', () => {
    document.getElementById('loggy').style.opacity = 0
    document.getElementById('loggy').style.color = 'white'
    let testcase = ['login', 'register', 'room']
    testcase.map(i => {
        let t = getUrlParameter(i)
        console.log(t)
        if (t) {
            if (i == 'login') {
                document.getElementById('loggy').innerHTML = "Login Failed, the credentials don't match any registered User."
                document.getElementById('loggy').style.opacity = 1
                document.getElementById('loggy').style.color = 'red'
            } else if (i == 'register') {
                if (document.getElementById('userid').value.includes('.com')) {
                    document.getElementById('loggy').innerHTML = "Email already used."
                } else {
                    document.getElementById('loggy').innerHTML = "Username already in Use."
                }
                document.getElementById('loggy').style.opacity = 1
                document.getElementById('loggy').style.color = 'red'
            } else {
                if (t == 'failed') {
                    document.getElementById('roomie').innerHTML = "Credentials Incorrect."
                } else {
                    document.getElementById('roomie').innerHTML = "Room is full at the moment."
                }
                document.getElementById('roomie').style.opacity = 1
                document.getElementById('loggy').style.color = 'red'
            }
        }
    })
})


function register_login(url) {
    const form = document.getElementById('form')
    let loggy = document.getElementById('loggy')

    loggy.style.opacity = 1;
    form.action = url
    form.method = "POST"
    setTimeout(() => {
        form.submit()
    }, 3500)

}

function join(url) {
    const form = document.getElementById('form2')
    let roomie = document.getElementById('roomie')

    roomie.style.opacity = 1;
    form.action = url
    form.method = "POST"
    setTimeout(() => {
        form.submit()
    }, 3500)

}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};