var mysql = require('mysql');
var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer'); //메일 전송을 위한 모듈
const crypto = require('crypto'); //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
var db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화
var moment = require('moment'); //회원가입 시 가입 날짜 시간 위한 모듈
require('moment-timezone'); //moment 모듈에서 한국 시간 구하기 위해 필요한 모듈
var emailAvailable = false;
var passwordMailSent = false;

//라우터로 사용하면서 app으로 썻던부분을 전부 router로 변경 e.g. app.post --> router.post
//그리고 owner는 main에서 호출할 때 /owner로 써줬기 때문에 owner.js에서는 라우딩에 /owner를 안써줘도된다.

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
    var ownerEmail = req.body.ownerEmail;
    var ownerPwd = req.body.ownerPwd;
    var ownerName = req.body.ownerName;
    var ownerPhoneNumber = req.body.ownerPhoneNumber;
    moment.tz.setDefault("Asia/Seoul"); //한국시간으로 설정
    var ownerJoinDate = moment().format("YYYY-MM-DD HH:mm:ss"); //format에 맞춰서 회원가입 할때 db에 저장 
    
    //salt 값은 현재 시간에 랜덤 값을 곱해서 생성된 문자열, db에 같이 저장
    var salt = Math.round((new Date().valueOf()*Math.random()))+"";
    //crypto를 이용하여 비밀번호 암호화 
    //createHash shat512 알고리즘 사용, 
    //update()는 인자로 salt를 적용하므로 평문 비밀번호에 salt값 더해서 넘겨줌
    //digest()는 인자로 인코딩 방식 hex사용 
    var hashedPwd = crypto.createHash("sha512").update(ownerPwd + salt).digest("hex");

    // db에 삽입을 수행하는 sql문
    var insert_sql = 
    'INSERT INTO Owners (OwnerEmail, OwnerPwd, OwnerName, OwnerPhoneNumber, OwnerSalt, OwnerJoinDate) VALUES (?, ?, ?, ?, ?, ?)';
    var params = [ownerEmail, hashedPwd, ownerName, ownerPhoneNumber, salt, ownerJoinDate];

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
    var ownerEmail = req.body.ownerEmail;

    //Email중복체크 수행하는 sql문
    var email_check_sql = 'SELECT * FROM Owners WHERE OwnerEmail = ?';

    //Email 중복체크를 수행 
    connection.query(email_check_sql, ownerEmail, function (err, data) {
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
    var ownerEmail = req.body.ownerEmail;
    var ownerPwd = req.body.ownerPwd;
    var sql = 'select * from Owners where OwnerEmail = ?';

    //sql문의 ?는 두번째 파라미터 ownerEmail로 치환된다.
    connection.query(sql, ownerEmail, function (err, result) {
        var resultCode = 500;
        var message = '에러가 발생했습니다';
        
        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) { //ownerEmail와 일치하는 결과가 없을 경우
                resultCode = 204;
                message = '존재하지 않는 계정입니다!';
            } else if ((crypto.createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex"))
                !== result[0].OwnerPwd) { //ownerEmail와는 일치하지만 ownerPwd가 다른 경우
                resultCode = 204;
                message = '비밀번호가 틀렸습니다!';
            } else { //ownerEmail과 ownerPwd가 모두 일치하는 경우
                resultCode = 200;
                message = '로그인 성공! ' + result[0].OwnerName + '님 환영합니다!';
                var ownerName = result[0].OwnerName;
            }
        }
        res.json({
            'code': resultCode,
            'message': message,
            'ownerName': ownerName
        });
    })
});

//이름과 전화번호로 이메일 찾는 부분
router.post('/find_email', function (req, res) {
    var ownerName = req.body.ownerName;
    var ownerPhoneNumber = req.body.ownerPhoneNumber;
    var sql = 'select OwnerEmail from Owners where OwnerName= ? && OwnerPhoneNumber= ?';
    var params = [ownerName, ownerPhoneNumber];

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
            var ownerEmail = result[0].OwnerEmail;
        }
        res.json({
            'code': resultCode,
            'message': message,
            'ownerEmail': ownerEmail
        });
    })
});

//이메일 이름 전화번호 비교후 일치하면 이메일로 비밀번호 보내주는 부분
router.post('/find_password',function(req, res){
    var ownerEmail = req.body.ownerEmail;
    var ownerName = req.body.ownerName;
    var ownerPhoneNumber = req.body.ownerPhoneNumber;
    var sql = 'select OwnerPwd from Owners Where (OwnerEmail = ? && OwnerName = ? && OwnerPhoneNumber = ?)';
    var params =[ownerEmail, ownerName, ownerPhoneNumber];

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
            passwordMailSend(ownerEmail,result[0].OwnerPwd);
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    })
});

//메일 보내는 함수
function passwordMailSend(ownerEmail, ownerPwd){
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
        to : ownerEmail, //받는 사람, 즉 비밀번호를 찾고싶어하는 가입자
        subject : '오더프리 계정찾기 이메일입니다.',
        text : '해당 계정의 비밀번호는 ' + ownerPwd + '입니다.'
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
