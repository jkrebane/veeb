// DEPENDENCIES
const express = require('express');
const fs = require('fs');
const mysql = require('mysql2');
const app = express();
const bodyparser = require('body-parser')
const timeInfo = require('./datetime_fnc');
const dbInfo = require('../../vp23config')

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));

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

// app.get('/news/read/:id/:lang', (req, res)=>{
//     //res.render('readnews');
//     console.log(req.params);
//     console.log(req.query);
//     res.send('Tahame uudist, mille id on: ' + req.params.id);
// });

// PORT
app.listen(5125);