var createError = require('http-errors');
var express = require('express');
var mysql = require('mysql');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require("http")
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

/*编辑连接MySQL数据库的请求信息,需要填入数据库的相关信息*/
var connection = mysql.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: 'root',
  database: 'woxu_news'
});

/*命令连接到数据库*/
connection.connect();

/* getsql 为 读取数据库数据的SQL语句, 此例中我们的表格叫 news , 要求以dates 日期为标准排序 降序*/
var getsql = "SELECT * FROM news ORDER BY dates DESC ";
/* 准备一个名为str对象, 当node得到数据库的数据之后, 将此str发送给前端*/
var str = "";
/* 用于删除命令的 deleteSQL */
var deleteSQL = "DELETE FROM news WHERE id =";

/* 向数据库发送 getsql 的 SQL语句, 并设置一个callback 方程, 包含错误 err 和 得到的结果 result*/
connection.query(getsql, function(err, result){
  if(err){
    /* 如果发生了error, 那么控制台显示error*/
    console.log('SELECT ERROR: ' + err.message);
  }
  /* 成功得到result后, 将其转为JSON格式, 并赋值给str*/
  str = JSON.stringify(result);
});

/* 当前端发来位于'/'路径的 get的请求时, 先给res加上Header, 再发送之前得到的str */
app.get('/', function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(str);
});

/* 当前端发来位于 '/addNews'路径的 post 请求时, 通过以下操作将发来的req中各个部分 填入 SQL语句中, 并将语句发送至MySQL*/
app.post('/addNews', function(req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var params = JSON.parse(Object.keys(req.body)[0]);
  // params.dates, params.titles, params.contents, params.pictures
  var postsql = "INSERT INTO news (dates, titles, contents, pictures) " +
      "VALUES (" + JSON.stringify(params.dates)+ "," + JSON.stringify(params.titles) + ", " + JSON.stringify(params.contents) + ", " + JSON.stringify(params.pictures)+ ")";
  console.log('This is the postSQL: ' + postsql);
  connection.query(postsql, function(err){
    if (err)
      console.log('POST error: ' + err)
  })
})

/* 当前端发送 put 修改请求时, 依次将req中各部分新的值 填入SQL语句中, 并发送到MySQL. 注意, 此时我们修改是依据 ID 这一项*/
app.post('/update', function (req, res){
  res.setHeader("Access-Control-Allow-Origin", "*");
  var params = JSON.parse(Object.keys(req.body)[0]);
  var id = JSON.stringify(params.id);
  var dates = JSON.stringify(params.dates);
  var titles = JSON.stringify(params.titles);
  var contents = JSON.stringify(params.contents);
  var pictures = JSON.stringify(params.pictures);

  var putsql = 'UPDATE news SET dates=' + dates + ', titles=' + titles + ', contents=' + contents +
      ', pictures=' + pictures + 'WHERE id=' + id;

  connection.query(putsql, function(err){
    if(err)
      console.log('PUT error' + err)
  })
});

/* 当前端发送 删除请求时, 根据ID 完成 SQL 语句, 并向MySQL发送请求.*/
app.post('/deleteNews', function(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  var params = JSON.parse(Object.keys(req.body)[0]);
  connection.query(deleteSQL + JSON.stringify(params.id), function(err){
    if(err)
      console.log('Delete error: ' + err);
  })

})

/* Node持续地在端口3000 监听发来的各种请求.*/
app.listen(3000, function (){

  console.log("Server running at 3000 port");

});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
