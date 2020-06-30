var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer'); //메일 전송을 위한 모듈
const crypto = require('crypto'); //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
var db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화
var emailAvailable = false;
var passwordMailSent = false;

//라우터로 사용하면서 app으로 썻던부분을 전부 router로 변경 e.g. app.post --> router.post
//그리고 user는 main에서 /user로 써줬기 때문에 이제 안써줘도댐

//mysql과의 연동 
var connection = mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    database: db_config.database,
    password: db_config.password,
    port: db_config.port
});

//회원가입 하는 부분
router.post('/join', function (req, res, next) {
    console.log(req.body);
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var userName = req.body.userName;
    var userMobilePhone = req.body.userMobilePhone;
    
    //암호화를 위해서 작성했는데 아직 미완성
    var salt = Math.round((new Date().valueOf()*Math.random()))+"";
    var hashedPwd = crypto.createHash("sha512").update(userPwd + salt).digest("hex");

    // db에 삽입을 수행하는 sql문
    var insert_sql = 'INSERT INTO Users (UserEmail, UserPwd, UserName, UserMobilePhone, salt) VALUES (?, ?, ?, ?, ?)';
    var params = [userEmail, hashedPwd, userName, userMobilePhone, salt];

    // insert_sql 문에서 values의 ?들은 두 번째 매개변수로 넘겨진 params의 값들로 치환된다.
    connection.query(insert_sql, params, function (err, result) {
        var resultCode = 500;
        var message = "에러가 발생했습니다."

        if (err) {
            console.log(err);
        } else if (emailAvailable === true) {
            resultCode = 200;
            message = '회원가입에 성공했습니다.';
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//이메일 중복체크 하는 부분
router.post('/join_emailAvailable', function (req, res) {
    var userEmail = req.body.userEmail;

    //Email중복체크 수행하는 sql문
    var email_check_sql = 'SELECT * FROM Users WHERE UserEmail = ?'

    //Email 중복체크를 수행 
    connection.query(email_check_sql, userEmail, function (err, data) {
        console.log(data);
        var resultCode = 500;
        var message = '에러가 발생했습니다';

        if (err) {
            console.log(err);
        } else if (data.length === 0) { //중복되는 email이 없는 경우 
            resultCode = 200;
            message = "email을 사용할 수 있습니다."
            emailAvailable = true;
        } else { //중복되는 email 있는 경우 중복임을 알려준다.
            console.log('email 중복');
            message = '이미 이메일이 존재합니다.'
        }

        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//로그인하는 부분
router.post('/login', function (req, res) {
    var userEmail = req.body.userEmail;
    var userPwd = req.body.userPwd;
    var sql = 'select * from Users where UserEmail = ?';

    //sql문의 ?는 두번째 파라미터 userEmail로 치환된다.
    connection.query(sql, userEmail, function (err, result) {
        var resultCode = 500;
        var message = '에러가 발생했습니다';
        
        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) { //userEmail와 일치하는 결과가 없을 경우
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if ((crypto.createHash("sha512").update(userPwd + result[0].salt).digest("hex"))
                !== result[0].UserPwd) { //userEmail와는 일치하지만 userPwd가 다른 경우
                console.log(crypto.createHash("sha512").update(userPwd + result[0].salt).digest("hex"));
                console.log(result[0].UserPwd);
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else { //userEmail과 userPwd가 모두 일치하는 경우
                resultCode = 200;
                message = '로그인 성공! ' + result[0].UserName + '님 환영합니다!';
                var userName = result[0].UserName;
            }
        }
        res.json({
            'code': resultCode,
            'message': message,
            'userName': userName
        });
    })
});

//이름과 전화번호로 이메일 찾는 부분
router.post('/find_email', function (req, res) {
    var userName = req.body.userName;
    var userMobilePhone = req.body.userMobilePhone;
    var sql = 'select UserEmail from Users where UserName= ? && UserMobilePhone= ?';
    var params = [userName, userMobilePhone];

    //sql문의 ?는 두번째 파라미터 params로 치환된다.
    connection.query(sql, params, function (err, result) {
        var resultCode = 500;
        var message = '이메일 찾기 에러가 발생했습니다';

        if (err) {
            console.log(err);
        }else if (result.length === 0) { //해당하는 이름과 전화번호가 db에 없는 경우
            resultCode = 204;
            message = '계정이 존재하지 않습니다!';
        }else { //이름과 전화번호가 db에 존재하는 경우
            resultCode = 200;
            message = '계정을 찾았습니다!'
            var userEmail = result[0].UserEmail;
        }
        res.json({
            'code': resultCode,
            'message': message,
            'userEmail': userEmail
        });
    })
});

//이메일 이름 전화번호 비교후 일치하면 이메일로 비밀번호 보내주는 부분
router.post('/find_password',function(req, res){
    var userEmail = req.body.userEmail;
    var userName = req.body.userName;
    var userMobilePhone = req.body.userMobilePhone;
    var sql = 'select UserPwd from Users Where (UserEmail = ? && UserName = ? && UserMobilePhone = ?)';
    var params =[userEmail, userName, userMobilePhone];

    connection.query(sql,params,function(err,result){
        var resultCode = 500;
        var message = "비밀번호 찾기 에러가 발생했습니다."

        if(err){
            console.log(err);
        }else if (result.length === 0 ){ //세가지 조건을 만족하는 결과가 없는 경우
            resultCode = 204;
            message = '계정이 존재하지 않습니다!';
        }else {
            resultCode = 200;
            message ="계정이 존재합니다."
            passwordMailSend(userEmail,result[0].UserPwd);
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    })
});

//메일 보내는 함수
function passwordMailSend(useremail, userpwd){
    // nodemailer Transport 생성
    var transporter = nodemailer.createTransport({
        service:'gmail',
        port :465,
        secure : true, //465 port에 대해서만 받고 나머지는 false
        auth:{ //이메일을 보낼 계정
            user: 'jryoun0404@gmail.com',
            pass: 'wjdals0404~',
        },
    });

    const emailOptions = {
        from : 'jryoun0404@gmail.com', //보내는 사람
        to : useremail, //받는 사람, 즉 비밀번호를 찾고싶어하는 가입자
        subject : '오더프리 계정찾기 이메일입니다.',
        text : '해당 계정의 비밀번호는 ' + userpwd + '입니다.'
    };

    transporter.sendMail(emailOptions, function(err, result){
        if(err){
            console.log(err);
        }else{
            console.log('메일이 전송되었습니다 : '+ result.response);
        }
    });
}


//무엇을 export할지를 결정하는것 
module.exports = router;
