// DEPENDENCIES
const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const app = express();
const bodyparser = require('body-parser');
const timeInfo = require('./datetime_fnc');
const dbInfo = require('../../vp23config');
const multer = require('multer');
const sharp = require('sharp');
// Seadistame vahevara (middleware), mis määrab üleslaadimise kataloogi
const upload = multer({dest: './public/gallery/orig/'})

app.set('view engine', 'ejs');
app.use(express.static('public'));
// Järgnev, kui ainult tekst siis "false", kui ka pilte ja muud siis "true"
app.use(bodyparser.urlencoded({extended: true}));

// ANDMEBAASI ÜHENDUS
const conn = mysql.createConnection({
    host: dbInfo.configData.host,
    user: dbInfo.configData.user,
    password: dbInfo.configData.password,
    database: dbInfo.configData.database
});

// AVALEHT
app.get('/', (req,res)=>{
    res.render('index');
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
/*
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

// POST JA SALVESTAMINE ANDMEBAASI
app.post('/eestifilm/addfilmperson', (req, res)=>{
    //res.send(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)';
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result)=>{
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
/** */
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

// UUDISTE LIST
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

// ÜHE UUDISE LUGEMINE
app.get('/news/read/:id', (req, res)=> {
    //res.render('readnews');
    let newsSQL = 'SELECT * FROM vpnews WHERE id = ? AND deleted IS NULL';
    let newsID = req.params.id;
    conn.query(newsSQL, [newsID], (err, result) => {
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
app.get('/photoupload', (req, res)=>{
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
        console.log('Faili laadimise viga: ' + err);
    });
    // Loome kaks väiksema mõõduga pildi varianti
    sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
    sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);

    // Foto andmed andmetabelisse
    let sql = 'INSERT INTO vpgallery (filename, originalname, alttext, privacy, userid) VALUES(?,?,?,?,?)';
    const userid = 1;
    conn.query(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, res)=>{
        if(err) {
            notice = 'Fotot andmete salvestamine ebaõnnestus!';
            res.render('photoupload', {notice: notice});
            throw err;
        } 
        else {
            notice = 'Foto ' + req.file.originalname + ' andmete salvestamine õnnestus!'
            res.render('photoupload', {notice: notice});
        }
    });
});

app.get('/photogallery', (req, res)=>{
    res.render('photogallery');
});

// PORT
app.listen(5125);