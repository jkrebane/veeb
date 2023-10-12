const express = require('express');
const timeInfo = require('./datetime_fnc');
const fs = require('fs');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req,res)=>{
    res.render('index');
});

app.get('/timenow', (req, res)=>{
    const dateNow = timeInfo.dateETformatted();
    const timeNow = timeInfo.timeETformatted();
    res.render('timenow', {nowD: dateNow, nowT: timeNow});
});

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

app.get('/listnames', (req, res)=>{
    let namesList = [];
    fs.readFile('public/txtfiles/log.txt', 'utf8', (err, data)=>{
        if(err) {
            throw err;
        }
        else {
            namesList = data.split(';');
            res.render('namesinlist', {h1: 'Sisestatud nimed', names: namesList});
        }
    })
});

app.listen(5125);