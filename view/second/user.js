var ident
var toggle = true
var room
var user
var idee
var socketId
var socket =io()
window.addEventListener('load', () => {
    let t = decodeURIComponent(document.cookie).split(';')
    t.map(i => {
        let b = i.split('=')
        if (b[0].trim() == 'video-chat-user') {
            ident = b[1].split('"')[1]
        }
    })
    fetch('/users?id=' + ident).then(res => res.json()).then(data => {
        user=data.username
        idee= data.id
        document.getElementsByTagName('h1')[0].innerHTML += data.username
        document.getElementById('ident').innerHTML += data.id
    })

    socket.on('join',(data)=>{
        socketId=data.id
        if(idee){
            socket.emit('list',{...data,ident,idee})
        }
        else{
            setTimeout(()=>{socket.emit('list',{...data,ident,idee})},5000)
        }
    })
    socket.on('invited',(data)=>{
        console.log('here', data, data.user)
        let el=document.createElement('div')
        el.setAttribute('id','inv')
        el.addEventListener('click',()=>{video(data.room)})
        el.innerHTML=data.user +" has sent you an invitation to video chat. Click here to join."
        document.getElementById('ident').appendChild(el)
    })

})

function join(num) {
    if (num) {
        let form = document.getElementById('joiner')
        form.action = '/join'
        form.method = 'POST'
        form.submit()
    } else {
        let el = document.createElement('form')
        el.setAttribute('class', 'newForm')
        el.setAttribute('id', 'joiner')
        el.innerHTML = '<div class="kin"><h4>Room Id: </h4><input name="room" id="input1" required></div><input name="id" value='+user+' type="hidden" ><button type="submit" onclick="join(1)">Go!</button>'
        el.addEventListener('submit', ()=>{join(1)})
        document.getElementById('join').appendChild(el)
    }
}

function create() {
    fetch('/id', { method: 'POST', cache: 'no-cache', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ident }) }).then(res => res.json()).then(id => {
        if (document.getElementById('invite')) {
            document.getElementById('invite').remove()
        }
        let el = document.createElement('div')
        el.setAttribute('id', 'invite')
        document.getElementById('create').appendChild(el)
        if (id !== 'Error') {
            room=id
            el.innerHTML = "<h3>Room Id created: " + id + "</h3><p>Please note that rooms and video chat has a maximum valid time of one hour.</p>" //<button onClick='video(id)'>Go To Room</button>"
            let ed=document.createElement('button')
            ed.addEventListener('click',()=>{
                console.log(id)
                video(id)
            })
            ed.innerHTML='Go to Room'
            el.appendChild(ed)
            document.getElementById('doneRoom').innerHTML = "Room Id: " + id
            setTimeout(() => {
                el.innerHTML += '<button onclick="contacts(1)">Invite Contacts +</button>'
            }, 3000)
        } else {
            el.innerHTML = "An Error occured, try Again Later"
        }
    })
}

function add() {
    let el = document.createElement('div')
    el.setAttribute('class', 'newForm')
    el.setAttribute('id', 'addForm')
    el.innerHTML = "<p>Enter the name and User ID of the person.</p><div><h4>Name: </h4><input name='name' id='name'></div><div><h4>User ID:</h4><input name='no' id='no'></div><div><button onclick='contacts(2)'>Add</button></div>"
    if (document.getElementById('add').children.length < 2) {
        document.getElementById('add').appendChild(el)
    } else {
        document.getElementById('add').removeChild(document.getElementById('add').children[1])
    }
}

function change() {
    let el = document.createElement('div')
    el.setAttribute('class', 'newForm')
    el.innerHTML = "<p>Enter the old and new password</p><p id='check'></p><div class='round'><h4>Old Password: </h4><input name='old' id='old'></div><div class='round'><h4> New Password: </h4><input name='new' id='new'></div><div class='round'><h4>Repeat New Password: </h4><input name='new2' id='new2'></div><div class='bossom'><button onClick='verify()'>Change</button></div>"
    document.getElementById('change').appendChild(el)
}

function verify() {
    let pass1 = document.getElementById('old').value
    let pass2 = document.getElementById('new').value
    let pass3 = document.getElementById('new2').value
    if (pass2 == pass3) {
        document.getElementById('check').innerHTML = ''

        fetch('/verify', { method: 'POST', cache: 'no-cache', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ident, password: pass1, password1:pass2 }) }).then(res =>res.json()).then(data=> {
            if (data.status == 'success') {
                document.getElementById('check').innerHTML = 'Password has been changed'
                setTimeout(() => {
                    document.getElementById('check').innerHTML = ''
                }, 15000)
            } else {
                document.getElementById('check').innerHTML = 'Old password is incorrect'
            }
        })
    } else {
    document.getElementById('check').innerHTML = 'New Passwords do not match'
    }
}

function contacts(num) {
    if (num == 1) {
        fetch('/contact', { method: 'POST', cache: 'no-cache', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ident }) }).then(res => res.json()).then(result => {
            if(document.getElementById('contactForm')){
                document.getElementById('create').removeChild(document.getElementById('contactForm'))
            }
            else{
                let el = document.createElement('div')
                el.setAttribute('id', 'contactForm')
                if (result !== 'Error') {
                    el.innerHTML = "<h3>Your Contacts</h3>"
                    result.contacts.map(i => {
                        let eld = document.createElement('div')
                        eld.setAttribute('class', 'contact')
                        eld.addEventListener('click', () => { dial(i.id) })
                        eld.innerHTML = '<h4>'+i.name+'</h4>'
                        el.appendChild(eld)
                    })
                } else {
                    el.innerHTML = 'An Error Occured, try again later'
                }
                document.getElementById('create').appendChild(el)
                setTimeout(() => {
                    document.getElementById('create').removeChild(document.getElementById('contactForm'))
                }, 30000)
            }
        })
    } else {
        let name = document.getElementById('name').value
        let id = document.getElementById('no').value
        let data = { id: ident, contact: id, name: name }
        fetch('/users', { method: 'PUT', cache: 'no-cache', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(res => res.json()).then(result => {
            let el = document.createElement('div')
            el.setAttribute('id', 'contactList')
            if (result != 'Error') {
                el.innerHTML = "<h3>Your Contacts</h3>"
                result.contacts.map(i => {
                    let eld = document.createElement('div')
                    eld.setAttribute('class', 'contact')
                    eld.addEventListener('click', () => { dial(i.id) })
                    eld.innerHTML = '<h4>'+i.name+'</h4>'
                    el.appendChild(eld)
                })
            } else {
                el.innerHTML = "An Error Occured, try again later"
            }
            document.getElementById('add').removeChild(document.getElementById('addForm'))
            document.getElementById('add').appendChild(el)
            setTimeout(() => {
                document.getElementById('add').removeChild(document.getElementById('contactList'))
            }, 15000)
        })
    }
}

function dial(id) {
    
    fetch('/users', { method: 'POST', cache: 'no-cache', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ident, contact: id }) }).then(res => res.json()).then(data=> {
        let el = document.createElement('div')
        if(id ==ident){
            el.innerHTML = 'You can\'t send an invite to yourself ' 
        }
        else{
            console.log(data)
            if (data.status == 'success') {
                socket.emit('invitation',{id,room,user,ident})
                el.innerHTML = 'Invite sent to contact'
            } else {
                el.innerHTML = 'An Error occured, try Again'
            }
            if (document.getElementById('contactForm')) {
                document.getElementById('create').removeChild(document.getElementById('contactForm'))
                document.getElementById('create').appendChild(el)
            } else if (document.getElementById('contactList')) {
                document.getElementById('add').removeChild(document.getElementById('contactList'))
                document.getElementById('add').appendChild(el)
            }
            //document.getElementById('invite').appendChild(document.getElementById('contactList'))
            setTimeout(() => {
                document.getElementById('invite').removeChild(document.getElementById('contactForm'))
                document.getElementById('add').removeChild(document.getElementById('contactList'))
            }, 15000)
        }
    })
}

function video(id) {
    console.log(id)
    let el = document.createElement('form')
    document.body.appendChild(el)
    el.innerHTML = '<input name="room" value=' + id + ' type="hidden" ><input name="id" value=' + user + ' type="hidden">'
    el.action = '/join'
    el.method = 'POST'
    console.log(el)
    el.submit()
}