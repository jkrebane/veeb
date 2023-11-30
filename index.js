// DEPENDENCIES
const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const app = express();
const bodyparser = require('body-parser');
const timeInfo = require('./datetime_fnc');
const dbInfo = require('../../vp23config');
const dataBase = ('if23_jorgen_re');
const multer = require('multer');
// Seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: './public/gallery/orig/'});
const sharp = require('sharp');
const async = require('async');
// Paroolide krüpteerimiseks
const bcrypt = require('bcrypt');
// Sessiooni jaoks
const session = require('express-session');

app.use(session({secret: 'minuAbsoluutseltSalajaneVõti', saveUninitialized: true, resave: false}));
let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Järgnev, kui ainult tekst siis "false", kui ka pilte ja muud siis "true"
app.use(bodyparser.urlencoded({extended: true}));

// ANDMEBAASI ÜHENDUS
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dataBase
});

// AVALEHT
app.get('/', (req,res)=>{
    res.render('index');
});

// SISSELOGIMINE
app.post('/', (req,res)=>{
    let notice = 'Sisesta oma kasutajakonto andmed'
    if(!req.body.emailInput || !req.body.passwordInput){
        console.log('Paha');
    }
    else {
        console.log('Hea');
        let sql = 'SELECT password FROM vpusers WHERE email = ?';
        conn.execute(sql, [req.body.emailInput], (err, result)=>{
            if(err) {
                notice = 'Tehnilise vea tõttu ei saa sisse logida';
                console.log(notice);
                res.render('index', {notice: notice});
            }
            else {
                notice = 'Sisse logitud';
                if(result[0] != null){
                    console.log(result[0].password);
                    bcrypt.compare(req.body.passwordInput, result[0].password, (err,compareresult)=>{
                        if(err) {
                            throw err;
                            // notice = 'Vale parool';
                            // console.log(notice);
                            // res.render('index',{notice: notice});
                        }
                        else {
                            if(compareresult){
                                mySession = req.session;
                                mySession.userName = req.body.emailInput;

                                notice = mySession.userName + 'On sisse loginud';
                                console.log('Sisse!');

                                res.render('index', {notice: notice});

                            }
                            else {
                                console.log('Vale parool');
                                res.render('index', {notice: notice});

                            }
                        }
                    });
                }
                else {
                    notice = 'Kasutajatunnus või parool on vale'
                    console.log(notice);
                    res.render('index', {notice: notice});
                }
            }
        });
        //res.render('index', {notice: notice});
    }
});

// LOGOUT
app.get('/logout', (req, res)=>{
    req.session.destroy();
    mySession = null;
    console.log('Logi välja');
    res.redirect('/');
});

// KASUTAJA LOOMINE
app.get('/signup',(req, res)=>{
    res.render('signup');
});

// KASUTAJA LOOMINE POST
app.post('/signup',(req, res)=>{
    let notice = 'Ootan andmeid...'
    console.log(req.body);
    if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) {
        console.log('Andmeid on puudu või pole nad korrektsed!');
        notice = 'Andmeid on puudu või pole nad korrektsed!'
        res.render('signup', {notice: notice});
    }
    else {
        console.log('OK!');
        bcrypt.genSalt(10, (err, salt)=>{
            bcrypt.hash(req.body.passwordInput, salt, (err, pwdhash)=>{
                let sql = 'INSERT INTO vpusers (firstName, lastName, birthDate, gender, email, password) VALUES(?,?,?,?,?,?)';
                conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdhash], (err, result)=>{
                    if (err){
                        console.log(err);
                        notice = 'Tehnilistel põhjustel kasutajat ei loodud!';
                        res.render('signup', {notice: notice});
                    }
                    else {
                        console.log('Kasutaja loodud!');
                        notice = 'Kasutaja ' + req.body.emailInput + ' loodud!'
                        res.render('signup', {notice: notice});
                    }
                });
            });
        });
    }
    //res.render('signup');
});

// TIMEINFO
app.get('/timenow', (req, res)=>{
    const dateNow = timeInfo.dateETformatted();
    const timeNow = timeInfo.timeETformatted();
    res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

// VANASÕNAD
app.get('/wisdom', (req, res)=>{
    let folkwisdom = [];
    fs.readFile('public/txtfiles/vanasonad.txt', 'utf8', (err, data)=>{
        if(err) {
            throw err;
        }
        else {
            folkwisdom = data.split(';');
            res.render('justlist', {h1: 'Vanasõnad', wisdom: folkwisdom});
        }
    });
});

// NAMELIST
app.get('/listnames', (req, res)=>{
    //let namesList = [];
    fs.readFile('public/txtfiles/log.txt', 'utf8', (err, data)=>{
        if(err) {
            throw err;
        }
        else {
            data = data.trim();
            const namesList = data.split(';');
            const formattedEntries = [];

            namesList.forEach(line=> {
                const values = line.split(',');
                if (values.length >=3){
                const formattedEntry = {
                    firstName: values[0],
                    lastName: values[1],
                    date: timeInfo.convertDate(values[2], "ET")
                };
                formattedEntries.push(formattedEntry);
                };
            });
            res.render('namesinlist', {h1: 'Sisestatud nimed', entries: namesList});
        };
    })
});

// EESTIFILM
app.get('/eestifilm', (req, res)=>{
    res.render('movieindex')
});

// FILMILOEND
app.get('/eestifilm/filmiloend', (req, res)=>{
    let sql = 'SELECT title, production_year, duration FROM movie';
    let sqlResult = [];
    conn.query(sql, (err, result)=>{
        if (err){
            res.render('filmlist', {filmlist: sqlResult})
            throw err;
            //conn.end();
        }
        else {
            res.render('filmlist', {filmlist: result})
            //conn.end();
        }
    });
});

// ADD FILM PERSON
app.get('/eestifilm/addfilmperson', (req, res)=>{
    res.render('addfilmperson')
});

// ADD FILM RELATION
app.get('/eestifilm/addfilmrelation', (req, res)=>{
    //kasutades async moodulit paneme mitu tegevust paralleelselt tööle
    //kõigepealt loome tegevuste loendi
    const myQueries = [
        function(callback){
            conn.execute('SELECT id, first_name, last_name FROM person', (err, result)=>{
                if (err) {
                    return callback (err);
                }
                else {
                    return callback(null, result);
                }
            });
        },
        function(callback){
            conn.execute('SELECT id, title FROM movie', (err, result)=>{
                if (err) {
                    return callback (err);
                }
                else {
                    return callback(null, result);
                }
            });
        }//veel ',' ja järgmine function jnejnejne...
    ];
    //paneme kõik need tegevused paralleelselt tööle, tulemuseks list (array) ühendtulemustest
    async.parallel(myQueries, (err, results)=>{
        if (err) {
            throw err;
        }
        else {
            //siin kõik asjad mis on vaja teha
            console.log(results);
        }
    });

    res.render('addfilmrelation')
});

// POST JA SALVESTAMINE ANDMEBAASI
app.post('/eestifilm/addfilmperson', (req, res)=>{
    //res.send(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)';
    conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
        if (err) {
            notice = 'Andmete salvestamine ebaõnnestus!!!!!!!';
            res.render('addfilmperson', {notice: notice});
            throw err
        }
        else {
            notice = req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!!!'
            res.render('addfilmperson', {notice: notice});
        }
    });
});

// ÜKS FILM
app.get('/eestifilm/singlemovie', (req, res)=>{
    res.render('singlemovie')
});

// POST ÜKS FILM
app.post('/eestifilm/singlemovie', (req, res)=>{
    let sql = 'SELECT COUNT(id) FROM movie';

    conn.query(sql, (err, countResult)=>{
        if (err){
            res.render('singlemovie', {singlemovie: countResult});
            //conn.end();
            throw err;
        }
        else {
            //console.log(result);
            const movieCount = countResult[0].movieCount;
            res.render('movieindex', {movieCount});
            //conn.end();
        }
    });
});

// UUDISED AVALEHT
app.get('/news', (req, res)=>{
    res.render('news');
});

// LISA UUDIS
app.get('/news/add', (req, res)=>{
    res.render('addnews');
});

// LISA UUDIS POST
app.post('/news/add', (req, res)=>{
    let notice = '';
    let sql = 'INSERT INTO vpnews (title, content, expire, userid) VALUES (?,?,?,1)';
    conn.query(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
        if (err) {
            notice = 'Andmete salvestamine ebaõnnestus!!!!!!!';
            res.render('addnews', {notice: notice});
            throw err
        }
        else {
            notice = 'Uudise ' + req.body.titleInput + ' salvestamine õnnestus!!!';
            res.render('addnews', {notice: notice});
        }
    });
});

// UUDISTE LIST dont work :()
app.get('/news/read', (req, res)=> {
    let sql = 'SELECT * FROM vpnews WHERE expire > CURRENT_DATE AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];

    conn.query(sql, (err, result)=>{
        if (err){
            res.render('readnews', {newsList: sqlResult});
            //conn.end();
            throw err;
        }
        else {
            //console.log(result);
            res.render('readnews', {newsList: result});
            //conn.end();
        }
    });
});

// ÜHE UUDISE LUGEMINE dont work :()
app.get('/news/read/:id', (req, res)=> {
    //res.render('readnews');
    let newSQL = 'SELECT * FROM vpnews WHERE id = ? AND deleted IS NULL';
    let newID = req.params.id;
    conn.query(newSQL, [newID], (err, result) => {
        if (err) {
            throw err;
        } else {
            if (result.length > 0) {
                res.render('singlenews', {news: result[0]});
            }else {
                throw err;
            }
        }
    });
});

// PILDI LAADIMINE
app.get('/photoupload', checkLogin, (req, res)=>{
    res.render('photoupload');
});

// PILDI LAADIMINE POST
app.post('/photoupload', upload.single('photoInput'), (req, res)=>{
    let notice = '';
    console.log(req.file);
    console.log(req.body);
    const fileName = 'vp_' + Date.now() + '.jpg';
    //fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)=>{
    fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err)=>{
        console.log('faili laadimisel viga' + err);
    });
    // loome kaks väiksema mõõduga pildivarianti
    sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality: 90}).toFile('./public/gallery/thumbs/' + fileName);

    sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality: 90}).toFile('./public/gallery/normal/' + fileName);

    // foto andmed andmetabelisse
    let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,?)';
    const userid = 1;
    conn.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
        if(err) {
            notice = 'Foto salvestamine ebaõnnestus';
            res.render('photoupload', {notice: notice});
            throw err;
        }
        else {
            notice = 'Foto ' + req.file.originalname + ' laeti üles';
            res.render('photoupload', {notice: notice});
        }
    });
});

// PILDIGALERII
app.get('/photogallery', (req, res)=> {
	let photoList = [];
	let sql = 'SELECT id,filename,alttext FROM vpgallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';
	conn.execute(sql, (err,result)=>{
		if (err){
            res.render('photogallery', {photoList : photoList});
			throw err;
		}
		else {
			photoList = result;
			console.log(result);
			res.render('photogallery', {photoList : photoList});
		}
	});
});

// LOGIN CHECK FUNCTION
function checkLogin(req, res, next){
    console.log('Kontrollime sisselogimist...');
    if(req.session != null){
        if(mySession.userName){
            console.log('SEES');
            next();
        }
        else {
            console.log('EI OLE SEES');
            res.redirect('/');
        }
    }
    else {
        res.redirect('/');
    }
}

// PORT
app.listen(5125);