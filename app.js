const express = require('express');
const app = express();

const cookieParser =  require("cookie-parser");
const path=  require('path');

const db = require('./config/mongoose-connection');
const usersRouter = require('./routes/usersRouter');
const indexRouter = require('./routes/index');
const MongoStore = require("connect-mongo");

const cors = require('cors');

const flash = require('connect-flash');
const expressSession = require("express-session");

require('dotenv').config();


app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(
    expressSession({
        resave:false,
        saveUninitialized:false,
        secret : process.env.EXPRESS_SESSION_SECRET,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
          }),
    })
)
app.use(flash());
app.use(express.static(path.join(__dirname,'public')));
app.set('view engine','ejs');

app.use(indexRouter)
app.use('/users',usersRouter);

app.listen(4000);