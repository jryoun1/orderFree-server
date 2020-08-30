import express, { static } from 'express';
import { json, urlencoded } from 'body-parser'; //body를 파싱하기 위해서 body-parser모듈 사용
const app = express();
<<<<<<< HEAD
import ownerRouter from './routes/owner'; //owner관련된 라우터들 다 모아뒀음 (로그인, 회원가입, 이메일 중복, 이메일찾기, 비밀번호 찾기)
import ownerMainRouter from './routes/main'; //owner어플 메인화면 관련된 라우터 모음
import userRouter from './routes/user';
import usermainRouter from './routes/usermain';
import { join } from "path";
=======

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
<<<<<<< HEAD
>>>>>>> 36e733348795b324999ecd5ee451b93aa5b91582
=======
>>>>>>> e8bdeca222f99f58863000e0d836a411ae5f1a5e
>>>>>>> 9fe5e3c66b333c5d9ad345d155fc2ae00962752f

app.use(json()); //본문이 json format 일 때
app.use(urlencoded({ extended: true })); //querystring모듈 사용해서 qs해석
app.use(static(join(__dirname, 'html')));
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'html', 'daum_address.html'));
})

//3000번 포트를 사용하여 수신 대기
app.listen(3000, function () {
    console.log('서버 실행 중...');
});

<<<<<<< HEAD
app.use('/owner', ownerRouter);
app.use('/main', ownerMainRouter);
app.use('/user', userRouter);
app.use('/usermain', usermainRouter);
=======
app.use('/owner',ownerRouter);
app.use('/main',ownermainRouter);
app.use('/user',userRouter);
app.use('/usermain',usermainRouter);

<<<<<<< HEAD
>>>>>>> 36e733348795b324999ecd5ee451b93aa5b91582
=======
>>>>>>> e8bdeca222f99f58863000e0d836a411ae5f1a5e
>>>>>>> 9fe5e3c66b333c5d9ad345d155fc2ae00962752f
