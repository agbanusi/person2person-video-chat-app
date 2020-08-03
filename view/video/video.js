 /*global*/
 var socket = io()
 let toggle = true
 var inner = ''
 var answersFrom={}
 var configuration
 var otherName 
 var pc
 var peerConnection = window.RTCPeerConnection ||
     window.mozRTCPeerConnection ||
     window.webkitRTCPeerConnection ||
     window.msRTCPeerConnection;

 var sessionDescription = window.RTCSessionDescription ||
     window.mozRTCSessionDescription ||
     window.webkitRTCSessionDescription ||
     window.msRTCSessionDescription;

 navigator.getUserMedia = navigator.getUserMedia ||
     navigator.webkitGetUserMedia ||
     navigator.mozGetUserMedia ||
     navigator.msGetUserMedia;

 window.addEventListener('load', () => {
     //configuration={'iceServers':p}
     //pc = new peerConnection(configuration)
     
     get()
     var users = document.getElementById('users')
     var person = document.getElementById('same')
     var roomy= document.getElementById('room')
     var {ident, username}=get_default()
     socket.on('join', data => {
         //let users = data.users.filter(i => i !== data.id)
         //addUsers(users)
         inner = data.id
         person.innerHTML ='Username: ' +username
         roomy.innerHTML ='Room Id: ' +ident
         socket.emit('notify-users',{...data,ident,username,return:false})
     })
     socket.on('add-users', data => {
         if(!data.return){
            otherName=data.username
            addUsers([data.id])
            //for a single p2p, for multiple I'll advise you send an array of objects containing id and usernames
            socket.emit('notify-users',{id:inner,ident,username,return:true})
         }
         else{
            otherName=data.username
            addUsers([data.id])
         }
     })
     socket.on('remove-user', (id) => {
         let div = document.getElementById('o' + filter(id))
         users.removeChild(div)
     })
     socket.on('chatted', (data) => {
         if (document.getElementById('h' + filter(data.ids)).style.backgroundColor != 'green') {
             document.getElementById('h' + filter(data.ids)).click()
         }
         append(data.ids, data.chat, 'receiver')
     })
     socket.on('offer-made', (data) => {
         console.log('offer made')
         pc.setRemoteDescription(new sessionDescription(data.offer)).then(() => {
             pc.createAnswer().then(answer => {
                 pc.setLocalDescription(new sessionDescription(answer)).then(() => {
                     socket.emit('make-answer', { answer, id: data.id })
                 })
             })
         })
     })
     socket.on('send-candidate',(data)=>{
         pc.addIceCandidate(data.candidate).catch(e=>{console.log(e.name)})
     })
     socket.on('answer', (data) => {
         pc.setRemoteDescription(new sessionDescription(data.answer))
         //.then(() => {
            // if (!answersFrom[data.id]) {
              //   connect(data.id)
               //  answersFrom[data.id] = true
             //}
             //else{pc.setLocalDescription(new sessionDescription(data.answer))}
             //track()
            // console.log(pc)
         //})
        setTimeout(()=>{pc.close()},3700000)
     })
     //cand()
     //track()
     //setInterval(()=>{
         //get()
         //pc = new peerConnection(configuration)
        //}, 120000)
 })
 
 function track(){
    pc.ontrack=(obj) => {
        if(!document.getElementById('video-small')){
            var vid = document.createElement('video')
            vid.setAttribute('class', 'video-small')
            vid.setAttribute('autoplay', 'autoplay')
            vid.setAttribute('id', 'video-small')
        }
        else{
            var vid=document.getElementById('video-small')
        }
        var visitor = document.getElementById('videos')
        document.getElementById('users-container').appendChild(vid);
        obj.streams.map(i => {
            visitor.srcObject = i;
        })
        show(vid)
    }
    show()
 }
 function cand(){
    let{ident,username}=get_default()
     pc.onicecandidate=(event)=>{
         if(event.candidate){
            socket.emit('candidate',{candidate:event.candidate,id:ident})
         }
         else{
             return
         }
     }
 }
 function get() {
    let{ident,username}=get_default()
        fetch('/try',{method:"POST",headers:{'Content-Type':'application/json'},body:JSON.stringify({ident:ident})}).then(res=>res.json()).then(data=>{
            let p=[]
            //p.push({urls:'stun:stun.l.google.com:19302'})
            data.ice.v.iceServers.urls=data.ice.v.iceServers.urls.slice(0,-2)
            p.push(data.ice.v.iceServers)
            configuration={'iceServers':p}
            pc = new peerConnection(configuration)
            track()
            cand()
        })
 }

 function filter(str) {
     let sc = str.replace('-', '___z')
     sc = sc[0] + sc[1] + sc[2] + sc[3] == 'aZZa' ? sc : 'aZZa' + sc
     return sc
 }

 function defilter(str) {
     let st = str.replace('___z', '-')
     st = st[0] + st[1] + st[2] + st[3] == 'aZZa' ? st.slice(4) : st
     return st
 }

 function show(vid) {
     navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        if (vid) {
             vid.srcObject = stream
         } else {
             document.querySelector('video').srcObject = stream;
         }
         stream.getTracks().map(track => {
             pc.addTrack(track, stream)
         })

     }).catch(error)
 }

 function addUsers(arr) {
     arr.map(id => {
                 let t = filter(id)
                 let el = document.createElement('div')
                 let ed = document.createElement('div')
                 let chat = document.createElement('div')
                 chat.innerHTML = `<p>Private chat with user</p> <div id=f${filter(id)} ><input class='chat' id=i${filter(id)} type='text'><button id='were' onclick='submitted(${`o${t}`});'>Send</button></div>`
         chat.style.borderRadius = '1rem'
         chat.style.backgroundColor = 'grey'
         chat.setAttribute('id', 'c' + filter(id))
         ed.innerHTML = '<h3> User: ' + otherName + '</h3'
         ed.style.border = '1px solid black'
         ed.style.borderRadius = '1rem'
         ed.style.backgroundColor = "#1f84c7"
         ed.setAttribute('id', 'h' + filter(id))
         ed.addEventListener('click', () => {
             if (toggle) {
                 ed.style.backgroundColor = "green"
                 console.log(id)
                 connect(id)
                 el.appendChild(chat)
             } else {
                 ed.style.backgroundColor = "#1f84c7"
                 el.removeChild(chat)
             }
             toggle = !toggle
         })
         el.appendChild(ed)
         el.setAttribute('id', 'o'+filter(id))
         el.setAttribute('class', 'users')
         el.style.backgroundColor = 'grey'
         el.style.borderRadius = '1rem'
         el.style.marginBottom = '0.5rem'
         users.appendChild(el)
         den = document.createElement('button')
         den.innerHTML='End Chat'
         den.addEventListener('click',()=>{
             pc.close()
             location.href='/login'
         })
         users.appendChild(den)

     })
 }

 function append(id, chats, type) {
     let div = document.getElementById('c' + filter(id))
     let item = document.createElement('div')
     item.innerHTML = chats
     item.style.borderRadius = '0.5rem'
     item.style.width = '35%'
     item.style.paddingTop = '0.25rem';
     item.style.paddingBottom = '0.25rem';
     item.style.marginBottom = '0.35rem'
     if (type) {
         item.style.backgroundColor = '#1f84c7'
         item.style.marginRight = '60%'
         item.style.marginLeft = '5%'
     } else {
         item.style.backgroundColor = 'green'
         item.style.marginLeft = '60%'
         item.style.marginRight = '5%'
     }
     div.insertBefore(item, div.children[div.children.length - 1])
 }

 function submitted(id) {
     id = id.id.slice(1)
     let chat = document.getElementById('i' + filter(id)).value
     append(id, chat)
     document.getElementById('i' + filter(id)).value = ''
     socket.emit('chat', { id:defilter(id), ids: inner, chat })
 }

 function get_default(){
    var ident, username
    let t = decodeURIComponent(document.cookie).split(';')
    t.map(i => {
        let b = i.trim().split('=')
        if (b[0] == 'video-chat-room') {
            ident = b[1]
        }
        else if(b[0]=='video-chat-username'){
            username=b[1]
        }
    })
    return {ident, username}
 }

 function connect(id) {
     pc.createOffer((offer) => {
         pc.setLocalDescription(new sessionDescription(offer)).then(() => {
             socket.emit('connect-to-user', { offer, id })
         }, error)
     }, error,{"offerToReceiveAudio":true,"offerToReceiveVideo":true})
 }

 function error(err) {
     console.warn('Error', err);
 }