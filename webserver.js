var express = require('express')
var app = express()

// SERVE STATIC SPA
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')
// PRINT HTML TO PDF
var bodyParser = require("body-parser")
var request = require('request')
var fs = require('fs')
var exec = require('child_process').exec;
var zipFolder = require('zip-folder');
var rimraf = require('rimraf');

var setHeaders = function (res, path, stat) {
    if (path.indexOf("login.html") != -1) {
        //console.log(path)
        //console.log(stat)
    }
    res.setHeader("Cache-Control", "no-store, must-revalidate")
    res.setHeader("Pragma", "no-cache")
    res.setHeader("Expires", 0)
}
var x = false;

function handleRedirect(req, res) {
    if (!x) {
        x = true;
        console.log({
            2: req.baseUrl,
            3: req.body,
            4: req.cookies,
            5: req.fresh,
            6: req.hostname,
            7: req.ip,
            8: req.ips,
            9: req.method,
            10: req.originalUrl,
            11: req.params,
            12: req.path,
            13: req.protocol,
            14: req.query,
            15: req.route,
            16: req.secure,
            17: req.signedCookies,
            18: req.stale,
            19: req.subdomains,
            20: req.xhr
        })
        console.log(req.route)
    }
    const targetUrl = targetBaseUrl + req.originalUrl;
    res.redirect(targetUrl);
}
//app.get('*', handleRedirect);

app.use(serveStatic(__dirname, {
    'index': ['/', 'login.html', 'index.html'],
    'redirect': false,
    'setHeaders': setHeaders
}))


var jsonParser = bodyParser.json({
    limit: 1024 * 1024 * 100,
    type: 'application/json'
})
var urlencodedParser = bodyParser.urlencoded({
    extended: true,
    limit: 1024 * 1024 * 100,
    type: 'application/x-www-form-urlencoding'
})

app.use(jsonParser)
app.use(urlencodedParser)

//UTILITIES FUNCTIONS
var guid = function () {
    var S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4()).toLowerCase();
}

var clearPrintShelf = function () {
    var ms = Date.now()
    fs.readdir("./print_shelf", function (err, list) {
        if (err) {
            console.log(err)
        }
        if (list) {
            list.forEach(function (file, index) {
                fs.stat("./print_shelf/" + file, function (err, stat) {
                    var endTime, now;
                    if (err) {
                        return console.error(err);
                    }
                    var ms_created = Date.parse(new Date(stat.ctime));
                    var difference = ms - ms_created;
                    //cancello tutti i file più vecchi di mezzora;
                    if (difference > (1000 * 60 * 30)) {
                        fs.unlink("./print_shelf/" + file, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        });
                    }
                })
            })

        }
    })
}

function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var pdf_file = new Buffer(base64str, 'base64');

    // write buffer to file
    fs.writeFileSync(file, pdf_file);
    console.log('******** File created from base64 encoded string ********');
}

// MIDDLEWARE
// case PrintPerformance: PRINT HTML TO PDF
// case: Base64 to PDF
app.post('/api', function (req, res) {
    res.set({
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        'Access-Control-Allow-Origin': '*'
    });

    try {
        var contents = fs.readFileSync('static/configs.json').toString();
        contents = JSON.parse(contents);
        var method = req.headers.role

        switch (method) {
            case "PrintPerformance":
                var risposta = ''
                var persona = req.body.persona
                var html = req.body.content
                //Lets configure and request
                if (html == null || html == '') {
                    res.send({
                        "error": "Errore nell'elaborazione del pdf"
                    });
                    clearPrintShelf()
                } else {
                    var nome = '';
                    if (req.body.titolo) {
                        nome = req.body.titolo;
                    }
                    if (persona) {
                        nome = nome + " - " + persona;
                    }
                    nome = nome + "_" + guid();

                    var filename = nome;
                    fs.writeFile("./print_shelf/" + filename + '.txt', html, function (err) {
                        if (err) {
                            res.send({
                                "error": err
                            });

                            clearPrintShelf()
                        } else {
                            var print = function () {
                                console.log("print() start");
                                exec('phantomjs.exe saveHtmlToPdf.js print.html "' + filename + '"', function (err, data) {

                                    if (err) {
                                        res.send({
                                            "error": err
                                        });
                                    } else {
                                        risposta = {
                                            "ok": -1,
                                            "path": 'print_shelf/' + filename + '.pdf'
                                        }
                                        res.send(risposta);
                                    }
                                    clearPrintShelf()
                                });
                            }
                            print();
                        }
                    });
                }
                break;
            case "GetCertificate":
                var urlAPI = contents.urlApiLearning;

                var token = req.headers.token
                var risposta = ''

                //console.log('Token:', req.headers.token)
                //console.log('Body:', req.body)

                var IdPartecipazione = req.body.IdPartecipazione
                var IdPartecipante = req.body.IdPartecipante
                var IdCorso = req.body.IdCorso
                var NomeCorso = req.body.NomeCorso
                var NomePersona = req.body.NomePersona
                var IdEdizione = req.body.IdEdizione
                var IdModulo = req.body.IdModulo
                var TipoFattibilita = req.body.TipoFattibilita
                var FlagDocente = req.body.FlagDocente
                var TipoModulo = req.body.TipoModulo

                //console.log('Valori:')
                //console.log(IdPartecipazione, IdPartecipante, IdCorso, IdEdizione, IdModulo, TipoFattibilita, FlagDocente, TipoModulo)

                //console.log('effettuo request:')

                //Lets configure and request

                request({
                    url: urlAPI + '/Webapi', //URL to hit
                    headers: {
                        "token": token,
                        "Content-Type": 'application/json',
                        "X-HTTP-Method-Override": "ApriModuli"
                    },
                    method: 'POST',
                    //Lets post the following key/values as form
                    json: {
                        "IdPartecipazione": IdPartecipazione,
                        "IdPartecipante": IdPartecipante,
                        "IdCorso": IdCorso,
                        "IdEdizione": IdEdizione,
                        "IdModulo": IdModulo,
                        "TipoFattibilita": TipoFattibilita,
                        "FlagDocente": FlagDocente,
                        "TipoModulo": TipoModulo
                    }
                }, function (error, response, body) {
                    if (error) {
                        console.log("ERRORE:", error);
                    } else {

                        var bod = body.split('{ "Response": ')[1].split('}')[0] + "}"
                        bod = JSON.parse(bod)
                        var IdTracking = bod.IdTracking
                        var Messaggio = bod.Messaggio
                        var Attestato = bod.Attestato

                        var stringacorso = NomeCorso;
                        try {
                            stringacorso = stringacorso.trim().toLowerCase();
                        } catch (err) {}
                        if (!stringacorso) {
                            stringacorso = IdCorso
                        }
                        var nomecertificato = NomePersona + "_" + stringacorso + "_" + guid();
                        base64_decode(Attestato, 'print_shelf/' + nomecertificato + '.pdf');
                        clearPrintShelf()

                        risposta = {
                            "Response": {
                                "IdTracking": IdTracking,
                                "Messaggio": Messaggio,
                                "Attestato": nomecertificato
                            }
                        }
                        res.send(risposta);
                    }
                });
                break;
            case "MassiveCertificate":
                var urlAPI = contents.urlApiLearning;

                var token = req.headers.token
                var body = req.body;
                var risposta = ''
                var promises = [];
                var streams = [];
                var errors = []
                var g = guid()
                var temp = "tmp_" + g;
                var dir = 'print_shelf/' + temp;
                var nome_corso = null;

                if (body && body.People) {
                    for (let i = 0; i < body.People.length; i++) {
                        promises.push(new Promise(function (resolve, reject) {
                            nome_corso = body.People[i].NomeCorso.slice(0, 20);

                            request({
                                url: urlAPI + '/Webapi', //URL to hit
                                headers: {
                                    "token": token,
                                    "Content-Type": 'application/json',
                                    "X-HTTP-Method-Override": "ApriModuli"
                                },
                                method: 'POST',
                                //Lets post the following key/values as form
                                json: {
                                    "IdPartecipazione": body.People[i].IdPartecipazione,
                                    "IdPartecipante": body.People[i].IdPartecipante,
                                    "IdCorso": body.People[i].IdCorso,
                                    "IdEdizione": body.People[i].IdEdizione,
                                    "IdModulo": body.People[i].IdModulo,
                                    "TipoFattibilita": body.People[i].TipoFattibilita,
                                    "FlagDocente": body.People[i].FlagDocente,
                                    "TipoModulo": body.People[i].TipoModulo
                                }
                            }, function (error, response, cont) {
                                if (error) {
                                    console.log("request error")
                                    console.log(error)
                                    resolve({
                                        "err": error
                                    })
                                } else {

                                    try {
                                        var bod = cont.split('{ "Response": ')[1].split('}')[0] + "}"
                                        bod = JSON.parse(bod)
                                        var Attestato = bod.Attestato
                                        if (Attestato == null) {
                                            resolve({
                                                "err": bod.Messaggio
                                            });
                                        } else {
                                            var stringacorso = body.People[i].NomeCorso;
                                            try {
                                                stringacorso = stringacorso.trim().toLowerCase();
                                            } catch (err) {}
                                            var nomecertificato = body.People[i].NomePersona + "_" + stringacorso + "_" + guid();
                                            if (!fs.existsSync(dir)) {
                                                fs.mkdirSync(dir);
                                            }

                                            // non uso base64decode, provo a eseguire in serie una writeFile asyncrona
                                            var pdf_file = new Buffer(Attestato, 'base64');
                                            fs.writeFile(dir + "/" + nomecertificato + '.pdf', pdf_file, (err) => {
                                                if (err) {
                                                    console.log("writeFile err:")
                                                    console.log(err);
                                                    resolve({
                                                        "err": err
                                                    });
                                                } else {
                                                    resolve({
                                                        "name": nomecertificato
                                                    });
                                                }
                                            });


                                        }

                                    } catch (err) {
                                        console.log("caught error")
                                        if (!cont) {
                                            console.log(response)
                                            resolve({
                                                "err": "Errore nella richiesta dell'attestato"
                                            });
                                        } else {
                                            console.log(err)
                                            resolve({
                                                "err": err
                                            });
                                        }
                                    }
                                }
                            });
                        }).then(function (res) {
                            if (res.err) {
                                errors.push({
                                    Persona: body.People[i].NomePersona,
                                    Messaggio: res.err
                                })
                            } else {
                                streams.push(res.name)
                            }
                        }, function (err) {}))

                    }
                    Promise.all(promises).then(function () {
                        if (streams && streams.length > 0) {
                            var zipPath = 'print_shelf/' + nome_corso + '_' + g + '.zip'
                            zipFolder(dir, zipPath, function (err) {
                                if (err) {
                                    risposta = {
                                        "Response": {
                                            "Certificati": null,
                                            "Errori": 'Errore nella compressione dei file'
                                        }
                                    }
                                    res.send(risposta);
                                    rimraf(dir, function () {
                                        //console.log(dir + ' removed');
                                    });
                                } else {
                                    risposta = {
                                        "Response": {
                                            "Certificati": zipPath,
                                            "Errori": errors
                                        }
                                    }
                                    res.send(risposta);
                                    // la directory da cui ho creato il .zip viene rimossa subito
                                    rimraf(dir, function () {
                                        //console.log(dir + ' removed');
                                    });
                                }
                            });
                        } else {
                            risposta = {
                                "Response": {
                                    "Certificati": null,
                                    "Errori": errors
                                }
                            }
                            res.send(risposta);
                        }

                        clearPrintShelf()
                    }, function (err) {
                        console.log("ERR")
                        console.log(err)
                        res.status(500).send(err)
                        clearPrintShelf()
                    })
                } else {
                    res.status(500).send({
                        "err": "L'elenco dei partecipanti non è stato passato correttamente"
                    })
                }

                break;
            default:
                res.status(404).send({
                    "err": "Method not found"
                })
        }
    } catch (err) {
        res.status(500).send({
            "err": err
        })
    }

})

app.options('/api', function (req, res) {
    var headers = {};

    headers["Access-Control-Allow-Origin"] = "*";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Credentials"] = false;
    headers["Access-Control-Max-Age"] = '86400'; // 24 hours
    headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Expires, Cache-Control, Accept, Access-Control-Allow-Origin, Role, Token, Pragma";
    res.writeHead(204, headers);
    res.end();
})


// SERVE STATIC DIRECTORY INDEX
app.use(serveIndex(__dirname))


// EXPRESS LISTEN
var port = 5555;
app.listen(port)
console.log("Listening on port " + port)
