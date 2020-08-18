const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer'); //메일 전송을 위한 모듈
const crypto = require('crypto'); //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
const db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화
const emailsend_config = require('../db-config/emailsend-config.json');
const moment = require('moment'); //회원가입 시 가입 날짜 시간 위한 모듈
require('moment-timezone'); //moment 모듈에서 한국 시간 구하기 위해 필요한 모듈
var emailAvailable = false;

//라우터로 사용하면서 app으로 썻던부분을 전부 router로 변경 e.g. app.post --> router.post
//그리고 owner는 main에서 호출할 때 /owner로 써줬기 때문에 owner.js에서는 라우딩에 /owner를 안써줘도된다.

//mysql과의 연동 
const connection = mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    database: db_config.database,
    password: db_config.password,
    port: db_config.port
});

//회원가입 하는 부분
router.post('/join', function (req, res, next) {
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    const ownerName = req.body.ownerName;
    const ownerPhoneNumber = req.body.ownerPhoneNumber;
    moment.tz.setDefault("Asia/Seoul"); //한국시간으로 설정
    const ownerJoinDate = moment().format("YYYY-MM-DD HH:mm:ss"); //format에 맞춰서 회원가입 할때 db에 저장 
    
    //salt 값은 현재 시간에 랜덤 값을 곱해서 생성된 문자열, db에 같이 저장
    const salt = Math.round((new Date().valueOf()*Math.random()))+"";
    //crypto를 이용하여 비밀번호 암호화 
    //createHash shat512 알고리즘 사용, 
    //update()는 인자로 salt를 적용하므로 평문 비밀번호에 salt값 더해서 넘겨줌
    //digest()는 인자로 인코딩 방식 hex사용 
    const hashedPwd = crypto.createHash("sha512").update(ownerPwd + salt).digest("hex");

    // db에 삽입을 수행하는 sql문
    const insert_sql = 
    'INSERT INTO Owners (OwnerEmail, OwnerPwd, OwnerName, OwnerPhoneNumber, OwnerSalt, OwnerJoinDate) VALUES (?, ?, ?, ?, ?, ?)';
    const params = [ownerEmail, hashedPwd, ownerName, ownerPhoneNumber, salt, ownerJoinDate];

    // insert_sql 문에서 values의 ?들은 두 번째 매개변수로 넘겨진 params의 값들로 치환된다.
    connection.query(insert_sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error"

        if (err) {
            console.log(err);
        } else if (emailAvailable === true) {
            resultCode = 201;
            message = 'Join Success';
            console.log(`${ownerEmail}로 ${ownerName}이름의 사용자가 가입을 하였습니다.`);
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//이메일 중복체크 하는 부분
router.post('/join/emailcheck', function (req, res) {
    const ownerEmail = req.body.ownerEmail;

    //Email중복체크 수행하는 sql문
    const email_check_sql = 'SELECT * FROM Owners WHERE OwnerEmail = ?';

    //Email 중복체크를 수행 
    connection.query(email_check_sql, ownerEmail, function (err, data) {
        let resultCode = 500;
        let message = 'Server Error';

        if (err) {
            console.log(err.stack);
        } else if (data.length === 0) { //중복되는 email이 없는 경우 
            resultCode = 201;
            message = "Email Available"
            emailAvailable = true;
            console.log('이메일 중복체크 결과 사용가능');
        } else { //중복되는 email 있는 경우 중복임을 알려준다.
            console.log('이메일 중복체크 결과 중복이메일 있다');
            resultCode = 400;
            message = 'Email Exist'
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//로그인하는 부분
router.post('/login', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    var ownerDeviceToken = req.body.ownerDeviceToken;
    const sql = 'select * from Owners where OwnerEmail = ?';

    //sql문의 ?는 두번째 파라미터 ownerEmail로 치환된다.
    connection.query(sql, ownerEmail, function (err, result) {
        let resultCode = 500;
        let message = 'Server Error';
        
        if (err) {
            console.log(err);
        } else {
            if (result.length === 0) { //ownerEmail와 일치하는 결과가 없을 경우
                resultCode = 400;
                message = 'Invalid Account';
            } else if ((crypto.createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex"))
                !== result[0].OwnerPwd) { //ownerEmail와는 일치하지만 ownerPwd가 다른 경우
                resultCode = 406;
                message = 'Wrong Password';
            } else { //ownerEmail과 ownerPwd가 모두 일치하는 경우
                resultCode = 201;
                message = 'Login Success';
                ownerDeviceTokenInsertDB(ownerDeviceToken, ownerEmail);
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

function ownerDeviceTokenInsertDB(ownerDeviceToken, ownerEmail){
    const sql = 'update Owners set OwnerDeviceToken = ? where OwnerEmail = ?';
    const params = [ ownerDeviceToken, ownerEmail];
    
    connection.query(sql, params, function(err,result){
        if(err){
            console.log(err);
        }else{
            console.log(`${ownerEmail} ownerDeviceToken update success!!`);
        }
    })
}

//이름과 전화번호로 이메일 찾는 부분
router.post('/login/emailfind', function (req, res) {
    const ownerName = req.body.ownerName;
    const ownerPhoneNumber = req.body.ownerPhoneNumber;
    const sql = 'select OwnerEmail from Owners where OwnerName= ? && OwnerPhoneNumber= ?';
    const params = [ownerName, ownerPhoneNumber];

    //sql문의 ?는 두번째 파라미터 params로 치환된다.
    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = 'Server Error';
        let ownerEmail = null;

        if (err) {
            console.log(err);
        }else if (result.length === 0) { //해당하는 이름과 전화번호가 db에 없는 경우
            resultCode = 400;
            message = 'Invalid Account';
        }else { //이름과 전화번호가 db에 존재하는 경우
            resultCode = 201;
            message = 'Found Account'
            ownerEmail = result[0].OwnerEmail;
            let splitedEmail = ownerEmail.split('\@');
            let encrpytedEmail;
            if(splitedEmail[0].length > 2){ //이메일 @앞부분이 3글자 이상인 경우 뒷부분 2개를 **로 표시
                encrpytedEmail = splitedEmail[0].slice(0,-2) + "*" + "*" ;
            }else{ //이메일 @ 앞부분이 2글자 아래인 경우, 즉 2개이거나 1개인 경우는 뒷부분 1개만 *로 표시
                encrpytedEmail = splitedEmail[0].slice(0,-1) + "*";
            }
            ownerEmail = encrpytedEmail + "@" + splitedEmail[1]; // @기준으로 분리했던부분 다시 연결해서 이메일 암호화
        }
        if(ownerEmail != null){
        res.json({
            'code': resultCode,
            'message': message,
            'ownerEmail': ownerEmail
        });
        }else {
            res.json({
                'code': resultCode,
                'message': message
            });
        }
    });
});

//이메일 이름 전화번호 비교후 일치하면 이메일로 토큰 보내주는 부분
router.post('/login/pwdfind',function(req, res){
    const ownerEmail = req.body.ownerEmail;
    const ownerName = req.body.ownerName;
    const ownerPhoneNumber = req.body.ownerPhoneNumber;
    const sql = 'select OwnerPwd from Owners Where (OwnerEmail = ? && OwnerName = ? && OwnerPhoneNumber = ?)';
    const params =[ownerEmail, ownerName, ownerPhoneNumber];

    connection.query(sql,params,function(err,result){
        let resultCode = 500;
        let message = "Server Error"

        if(err){
            console.log(err);
        }else if (result.length === 0 ){ //세가지 조건을 만족하는 결과가 없는 경우
            resultCode = 400;
            message = 'Invalid Account';
        }else {
            resultCode = 200;
            message ="Found Account"
            var token = passwordMailSend(ownerEmail); //메일 보내주는 부분 
        }
        res.json({
            'code' : resultCode,
            'message' : message,
            'ownerEmail' : ownerEmail,
            'token' : token
        });
    })
});

//메일 보내는 함수
function passwordMailSend(ownerEmail){

    // nodemailer Transport 생성
    const transporter = nodemailer.createTransport({
        service:'gmail',
        port :465,
        secure : true, //465 port에 대해서만 받고 나머지는 false
        auth:{ //이메일을 보낼 계정
            user: emailsend_config.user,
            pass: emailsend_config.pass,
        },
    });

    const token = crypto.randomBytes(4).toString('hex');
    let letter = `오더프리 ${ownerEmail}사용자님 반갑습니다.
오더프리 비밀번호 찾기 결과입니다.
해당 토큰을 10:00분 안에 어플에 입력해주세요. 토큰은 "${token}" 입니다.
감사합니다.`
    const emailOptions = {
        from : 'jryoun0404@gmail.com', //보내는 사람
        to : ownerEmail, //받는 사람, 즉 비밀번호를 찾고싶어하는 가입자
        subject : '오더프리계정 찾기 메일입니다.',
        text : letter
    };

    transporter.sendMail(emailOptions, function(err, result){
        if(err){
            console.log(err);
        }else{
            console.log('Mail Sent : '+ result.response);
        }
    });
    return token;
}


//비밀번호 찾기에서 비밀번호 변경하는 부분
router.post('/login/changepwd',function(req, res){
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    const salt = Math.round((new Date().valueOf()*Math.random()))+"";
    const hashedPwd = crypto.createHash("sha512").update(ownerPwd + salt).digest("hex");
    const sql = 'update Owners set OwnerPwd = ?, OwnerSalt =? where OwnerEmail = ?';
    const params =[hashedPwd, salt ,ownerEmail];

    connection.query(sql,params,function(err,result){
        let resultCode = 500;
        let message = "Server Error"

        if(err){
            console.log(err);
        }else if (result.length === 0 ){ //받아온 이메일이 존재하지 않는경우
            resultCode = 400;
            message = 'Invalid Account';
        }else {
            console.log("Password Changed")
            resultCode = 200;
            message ="Password Changed"
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    })
});


//무엇을 export할지를 결정하는것 
module.exports = router;
