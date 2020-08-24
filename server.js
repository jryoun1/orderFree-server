const express = require('express');
const bodyParser = require('body-parser'); //body를 파싱하기 위해서 body-parser모듈 사용
const app = express();

//ownerapp 관련된 라우터들 기능별로 모아서 정리
//ownerRouter : 로그인, 회원가입, 이메일 중복, 이메일찾기, 비밀번호 찾기 
//ownermainRouter : 메인 화면에서의 기능들 - 메뉴등록, 주문목록, 주문현황확인 ,개인정보수정(가게등록) 등
const ownerRouter = require('./routes/owner') 
const ownermainRouter = require('./routes/main') 

//user관련된 라우터들 다 모아뒀음 
//userRouter : 로그인, 회원가입, 이메일 중복, 이메일찾기, 비밀번호 찾기 기능
//usermainRouter : 메인화면에서의 기능들 - 주문목록확인, 개인정보수정, qr코드 인식 등
const userRouter = require('./routes/user') 
const usermainRouter = require('./routes/usermain')

//가게등록 시 도로명 주소찾기 웹 뷰에 띄워줄 html파일 path 설정
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
app.use('/main',ownermainRouter);
app.use('/user',userRouter);
app.use('/usermain',usermainRouter);

