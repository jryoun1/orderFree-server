const express = require('express');
const bodyParser = require('body-parser'); //body를 파싱하기 위해서 body-parser모듈 사용
const app = express();
const ownerRouter = require('./routes/owner') //owner관련된 라우터들 다 모아뒀음 (로그인, 회원가입, 이메일 중복, 이메일찾기, 비밀번호 찾기)
const ownerMainRouter = require('./routes/main') //owner어플 메인화면 관련된 라우터 모음
const userRouter = require('./routes/user')
const usermainRouter = require('./routes/usermain')
const path = require("path");

app.use(bodyParser.json()); //본문이 json format 일 때
app.use(bodyParser.urlencoded({ extended: true })); //querystring모듈 사용해서 qs해석
app.use(express.static(path.join(__dirname,'html')));
app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname, 'html', 'daum_address.html'));
})


//3000번 포트를 사용하여 수신 대기
app.listen(3000, function () {
    console.log('서버 실행 중...');
});

app.use('/owner',ownerRouter);
app.use('/main',ownerMainRouter);
app.use('/user',userRouter);
app.use('/usermain',usermainRouter);

