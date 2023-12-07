const express = require('express');
//loome oma rakenduse sees toimiva mini-appi
const router = express.Router(); // SUUR algustäht "R" on oluline
const pool = require('../src/databasepool').pool;

//kuna siin on mini-app router, siis kõik marsruudid on temaga, mitte app-iga seotud
//kuna kõik siinsed marsruudid algavad "/news", siis selle jätame ära

// UUDISED AVALEHT
router.get('/', (req, res)=>{
    res.render('news');
});

// LISA UUDIS
router.get('/add', (req, res)=>{
    res.render('addnews');
});

// LISA UUDIS POST
router.post('/add', (req, res)=>{
    let notice = '';
    let sql = 'INSERT INTO vpnews (title, content, expire, userid) VALUES (?,?,?,1)';
    pool.getConnection((err, connection)=>{
        if(err) {
            throw err;
        }
        else {
            //andmebaasi osa
            connection.execute(sql, [req.body.titleInput, req.body.contentInput, req.body.expireInput], (err, result)=>{
                if (err) {
                    notice = 'Andmete salvestamine ebaõnnestus!!!!!!!';
                    res.render('addnews', {notice: notice});
                    connection.release();
                    throw err
                }
                else {
                    notice = 'Uudise ' + req.body.titleInput + ' salvestamine õnnestus!!!';
                    res.render('addnews', {notice: notice});
                    connection.release();
                }
            });
        }
    });  
});

// UUDISTE LIST dont work :()
router.get('/read', (req, res)=> {
    let sql = 'SELECT * FROM vpnews WHERE expire > CURRENT_DATE AND deleted IS NULL ORDER BY id DESC';
    let sqlResult = [];
    pool.getConnection((err, connection)=>{
        if(err) {
            throw err;
        }
        else {
            //andmebaasi osa
            connection.execute(sql, (err, result)=>{
                if (err){
                    res.render('readnews', {newsList: sqlResult});
                    //conn.end();
                    connection.release();
                    throw err;
                }
                else {
                    //console.log(result);
                    res.render('readnews', {newsList: result});
                    connection.release();
                    //conn.end();
                }
            });
        }
    });
});

// ÜHE UUDISE LUGEMINE dont work :()
router.get('/read/:id', (req, res)=> {
    //res.render('readnews');
    let newSQL = 'SELECT * FROM vpnews WHERE id = ? AND deleted IS NULL';
    let newID = req.params.id;
    pool.getConnection((err, connection)=>{
        if(err) {
            throw err;
        }
        else {
            //andmebaasi osa
            connection.execute(newSQL, [newID], (err, result) => {
                if (err) {
                    connection.release();
                    throw err;
                } else {
                    if (result.length > 0) {
                        res.render('singlenews', {news: result[0]});
                        connection.release();
                    }else {
                        connection.release();
                        throw err;
                    }
                }
            });
        }
    });
});

module.exports = router;