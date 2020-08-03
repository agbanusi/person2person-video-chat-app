const fetch = require('node-fetch');
var ice

//setting up a binary buffer
function btoa(str) {
    var buffer;
    if (str instanceof Buffer) {
    buffer = str;
    } else {
    buffer = new Buffer(str.toString(), 'binary');
    }

    return buffer.toString('base64');
}

//getting a promise based return from a TURN server engine
function result(){
    try{    
        fetch('https://global.xirsys.net/_turn/Test',{method:'PUT',headers:{"Authorization": "Basic " + btoa(process.env.ICE),"Content-Type": "application/json"}, body:JSON.stringify({"format": "urls","expire": "180"}) }).then(res=>res.json()).then(data=>{
            try{ice = data}catch(err){console.log(err)}
        })
    } catch(error){
        console.log('error'+ error)
    }
}

//define ice
//var ice = async()=> await result()
//async()=> {ice=await result()}
result()
//main routing function
module.exports = function routes(app, db, bcrypt, id, ObjectID) {

    app.get('/', (req, res) => {
        res.sendFile("index.html", { root: './view/first' })
    })
    app.post('/register', (req, res) => {
        let user = req.body.user
        if (user == '') {
            res.redirect('/?register=failed')
        } else if (user.includes('.com')) {
            var user2 = user.slice(0, 3) + user.slice(5, 2) + id.generate().slice(0, 2)
        } else {
            var user2 = user
        }
        let ide = id.generate()
            //console.log(user2)
        bcrypt.hash(req.body.passwords, 13, (err, hash) => {
            db.collection('video-chat-users').findOne({ $or: [{ 'email': user }, { 'username': user2 }] }, (err, doc) => {
                if (doc == null) {
                    db.collection('video-chat-users').insertOne({ id: ide, username: user2, email: user, password: hash, contacts: [] }, (err, don) => {
                        console.log(don.ops[0]._id)
                        res.sendFile("user.html", { root: './view/second' })
                        res.cookie('video-chat-user', don.ops[0]._id, { maxAge: 900000, httpOnly: false, sameSite: true })
                    })

                } else {
                    res.redirect('/?register=failed')
                }
            })
        })

    })
    app.post('/login', (req, res) => {
        db.collection('video-chat-users').findOne({ $or: [{ 'username': req.body.user }, { 'email': req.body.user }] }, (err, doc) => {
            if (doc == null) {
                res.redirect('/?login=failed')
            } else {
                bcrypt.compare(req.body.passwords, doc.password, (err, result) => {
                    if (result) {
                        res.sendFile("user.html", { root: './view/second' })
                        res.cookie('video-chat-user', doc._id, { maxAge: 3600000, httpOnly: false, sameSite: true })
                    } else {
                        res.redirect('/?login=failed')
                    }
                })
            }
        })

    })
    app.post('/join', (req, res) => {
        console.log(req.body)
        db.collection('video-chat-rooms').findOne({ 'room': req.body.room }, (err, doc) => {
            if (doc && doc.count <2) {
                db.collection('video-chat-rooms').findOneAndUpdate({ 'room': req.body.room }, { $inc: { 'count': 1 } })
                res.sendFile("video.html", { root: './view/video' })
                res.cookie('video-chat-room', req.body.room, { maxAge: 900000, httpOnly: false, sameSite: true })
                res.cookie('video-chat-username', req.body.id, { maxAge: 900000, httpOnly: false, sameSite: true })
            } else {
                if (doc) {
                    res.redirect('/?room=full')
                } else {
                    res.redirect('/?room=failed')
                }
            }
        })
    })
    app.post('/id', (req, res) => {
        db.collection('video-chat-users').findOne({ _id: new ObjectID(req.body.id) }, (err, doc) => {
            if (doc) {
                let ide = id.generate()
                db.collection('video-chat-rooms').insertOne({ id:doc._id, room: ide, count: 0, time: new Date() })
                res.json(ide)
            } else {
                res.send('Error')
            }
        })
    })
    app.post('/verify', (req, res) => {
        db.collection('video-chat-users').findOne({ _id: new ObjectID(req.body.id) }, (err, doc) => {
            if (doc) {
                bcrypt.compare(req.body.password,doc.password, (err, result) => {
                    if (result) {
                        bcrypt.hash(req.body.password1, 13, (err, hash) => {
                            db.collection('video-chat-users').findOneAndUpdate({ _id: new ObjectID(req.body.id) },{$set:{ password: hash }},{upsert:true})
                                res.json({status:'success'})
                        })

                    } else {
                        console.log('err')
                        res.json({status:'Error'})
                    }
                })
            } else {
                res.json({status:'Error'})
            }
        })
    })
    app.post('/contact', (req, res) => {
        db.collection('video-chat-users').findOne({ _id: new ObjectID(req.body.id) }, (err, doc) => {
            if (doc) {
                res.json({ contacts: doc.contacts })
            } else {
                res.send('Error')
            }
        })
    })
    app.route('/users')
        .post((req, res) => {
            console.log(req.body)
            db.collection('video-chat-users').findOne({ _id: new ObjectID(req.body.id) }, (err, doc) => {
                if (doc) {
                    let key = doc.contacts.filter(i=>i.id==req.body.contact)
                    if (key.length >0) {
                        db.collection('video-chat-users').findOne({ id: key[0].id }, (err, docs) => {
                            if (docs) {
                                res.json({status:'success'})
                            } else {
                                res.json({status:'Error'})
                            }
                        })
                    } else {
                        res.json({status:'Error'})
                    }
                } else {
                    res.json({status:"Error"})
                }
            })
        })
        .put((req, res) => {
            db.collection('video-chat-users').findOneAndUpdate({ _id: new ObjectID(req.body.id) }, { $push: { contacts: { name: req.body.name, id: req.body.contact } } }, (err, doc) => {
                if (doc) {
                    let newer = doc.value.contacts
                    newer.push({ name: req.body.name, id: req.body.contact })
                    res.json({ contacts: newer })
                } else {
                    res.send('Error')
                }
            })
        })
        .get((req,res)=>{
            db.collection('video-chat-users').findOne({ _id: new ObjectID(req.query.id) }, (err, doc) => {
                if (doc) {
                    res.send(doc)
                } else {
                    res.redirect('/?login=failed')
                }
            })
        });

    app.post('/try',(req,res)=>{
        db.collection('video-chat-rooms').findOne({ 'room':req.body.ident }, (err, doc) => {
            if(!ice){
                res.redirect('/login')
            }else{
                if(doc){
                    res.json({ice})
                }
                else{
                    res.send('Failed')
                }
            }
            
        })
        try{
        db.collection('video-chat-rooms').deleteMany({count:2 })
        }catch(err){
            console.log(err)
        }
    })
}

//interval fetch request to TURN engine
setInterval(()=>{
    result()},150000)