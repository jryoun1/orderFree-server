const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화
const serviceAccount = require('../db-config/fcm-serviceAccountKey.json');
const crypto = require('crypto'); //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
const admin = require("firebase-admin");

//mysql과의 연동 
const connection = mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    database: db_config.database,
    password: db_config.password,
    port: db_config.port
});

/*----------------------------- 메인 화면 개인정보 관련 소스코드 -----------------------------------*/

//메인화면에서 개인정보 눌렀을 경우 
router.post('/info',function(req,res){
    const userEmail = req.body.userEmail;
    const sql = 'select UserName from Users where UserEmail = ?';

    connection.query(sql,userEmail,function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "Invalid Account";
        }else{
            resultCode = 200;
            message = "Load Success";
            console.log("User main info load success");
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//내 정보 수정에서 비밀번호 변경 (현재 비밀번호 입력 후 변경 버튼 클릭 시)
//이메일 주소 입력하면 db에서 해당하는 User의 UserSalt와 비밀번호 가져와서
//사용자가 입력한 것에 Salt값 연산후 UserPwd와 비교하여 일치하는지 확인 -- By 정민
router.post('/info/checkpwd', function(req,res){
    const userEmail = req.body.userEmail;
    const userPwd = req.body.userPwd;
    const sql = 'select UserPwd, UserSalt from Users where UserEmail = ?';

    connection.query(sql, userEmail,function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = 'Invalid Email';    
        }else if(result[0].UserPwd !== crypto.createHash("sha512").update(userPwd + result[0].UserSalt).digest("hex")){
            resultCode = 400;
            message = 'Wrong Password';
        }else if(result[0].UserPwd === crypto.createHash("sha512").update(userPwd + result[0].UserSalt).digest("hex")){
            resultCode = 200;
            message = 'Right Password';
            console.log("usermain info check password success");
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//개인 정보 수정에서 회원 탈퇴 부분 (계정삭제하기 버튼 클릭시)
router.post('/info/withdraw',function(req,res){
    const userEmail = req.body.userEmail;
    const ownerWithdraw = true; //회원탈퇴하면 true값으로 변경 default = 0(false)
    const trashOwnerEmail = null; //탈퇴하면 email중복검사에서 해당 email을 사용할 수 있게 하기 위해 trash email id 입력
    const sql = 
    'update Owners set IsUserDeleted = ? , UserEmail =? where UserEmail = ?';
    const params = [ownerWithdraw, trashOwnerEmail, userEmail];

    connection.query(sql, params,function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else{
            resultCode = 200;
            message = 'Account Deleted';
            console.log("user withdraw success");    
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//개인정보에서 주문 내역 눌렀을 경우 (지금까지 주문 했던 음식들, 주문을 해서 받았던 음식들만 포함. 현재 주문해서 기다리는 음식은 포함되지 않음)
//sql문 = Order테이블의 UserNum이랑 같은 UserNum의 OrderNum과 메뉴이름을 뽑고, Order테이블의 OwnerEmail과 같은 Owners테이블의 Owner가게 이름을 뽑으면 됨. (IsOrderCompleted = 1인 것만)
router.post('/info/orderRecord',function(req,res){
    const userEmail = req.body.userEmail;
    const sql = 'select O.OrderNum, json_extract(ShoppingList,\'$."menu"\') as menuName, Owners.OwnerStoreName from Orders O LEFT OUTER JOIN Users U ON O.UserNum = U.UserNum LEFT OUTER JOIN Owners ON O.OwnerEmail = Owners.OwnerEmail WHERE U.UserEmail = ? and O.IsCompleted = 1'

    connection.query(sql,userEmail,function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        let resultArray = new Array();

        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "No orderRecords exist";
        }else{
            resultCode = 200;
            messaage = "orderRecords Load Success";
            for (var i = 0; i < result.length; i++){
                var resultJson = new Object();
                var menuName = result[i].menuName.substring(1,result[i].menuName.indexOf("\"",1));
                resultJson.orderNum = result[i].OrderNum;
                resultJson.ownerStoreName = result[i].OwnerStoreName;
                resultJson.menuName = menuName;
                resultArray.push(resultJson);
            }
            console.log("User info orderRecord Load success");
        }
        res.json({
            resultArray,
            'code' : resultCode,
            'message' : message
        });
    });
});

/*----------------------------- 메인 화면에서 작동 소스코드 ----------------------------------*/

//메인 화면에서 주문확인 버튼 클릭 시 (현재 qr를 찍은 매장에서 주문을 했다면, 주문확인 버튼 클릭 시 주문 내역을 보여준다.)
//sql문 = Orders 테이블에서 해당 ownerEmail이 들어가고 userEmail로 주문이 되어있는 메뉴들의 주문날짜, 주문번호, 메뉴이름, 메뉴수량을 뽑고, 
//        Owners에서 해당 ownerEmail을 가진 Owner의 가게이름을 넘겨준다. (Orders에서 Iscompleted = 0인것만 출력)
router.post('/ordercheck',function(req,res){
    const userEmail = req.body.userEmail;
    const ownerEmail = req.body.ownerEmail;
    const sql = 'select Owners.OwnerStoreName, O.OrderedDate, O.OrderNum, json_extract(ShoppingList,\'$."menu"\') as menuName, json_extract(ShoppingList,\'$."count"\') as menuCount from Orders O LEFT OUTER JOIN Users U ON O.UserNum = U.UserNum LEFT OUTER JOIN Owners ON O.OwnerEmail = Owners.OwnerEmail WHERE U.UserEmail = ? and O.IsCompleted = 0 and O.OwnerEmail =?'
    const params = [userEmail, ownerEmail];

    connection.query(sql,params,function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        let resultArray = new Array();

        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "No Order Exist";
        }else{
            resultCode = 200;
            messaage = "orderCheck Load Success";
            for (var i = 0; i < result.length; i++){
                var resultJson = new Object();
                var menuName = result[i].menuName.substring(1,result[i].menuName.indexOf("\"",1));
                resultJson.ownerStoreName = result[i].OwnerStoreName;
                resultJson.orderedDate = result[i].OrderedDate;
                resultJson.orderNum = result[i].OrderNum;
                resultJson.menuName = menuName;
                resultJson.menuCount = menuCount;
                resultArray.push(resultJson);
            }
            console.log("User main ordercheck Load success");
        }
        res.json({
            resultArray,
            'code' : resultCode,
            'message' : message
        });
    });
});

//메인화면에서 QR코드 스캔 버튼 누르고 qr코드 스캔시
//sql = Menus테이블에서 Owner이메일이 QRcode의 파싱된 것과 일치하는 이메일과 일치하는 Menu들을 전부 출력 
router.post('/qrcode/storeinfo',function(req,res){
    const qrcodeParsing = req.body.qrcodeParsing;
    const sql = 'select O.OwnerStoreName ,M.Menu from Menus M LEFT OUTER JOIN QRcodes ON QRcodes.OwnerEmail = M.OwnerEmail LEFT OUTER JOIN Owners O ON O.OwnerEmail = QRcodes.OwnerEmail where QRcodes.Qrcode = ?';

    connection.query(sql,qrcodeParsing, function(err,result){
        let resultCode = 500;
        let message ="Server Error";
        let resultArray = new Array();

        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "Not Registered Store";
        }else{
            for(var i = 0 ; i < result.length; i++){
                var resultJson = new Object();
                resultJson.ownerStoreName = result[i].OwnerStoreName;
                resultJson.menus = result[i].Menu;
                resultArray.push(resultJson);
            }
            resultCode = 200;
            message = "Menu Load Success";
            console.log("user load Menu success from "+ result[0].OwnerStoreName);
        }
        res.json({
            resultArray,
            'code' : resultCode,
            'message' : message
        });
    });
});


//주문 목록확인에서 음식 준비 완료 눌렀을 때 
router.post('/orderlist/complete', function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const userEmail = req.body.userEmail;
    const shoppingList = req.body.shoppingList;
    
    const sql = 'insert into Orders(UserNum,OwnerEmail,ShoppingList,OrderedDate,IsCompleted) values (?,?,?,now(),false)';
    const params = [userEmail, ownerEmail, shoppingList];

    connection.query(sql, params, function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else{
            sendAlaramToOwner(userEmail,ownerEmail);
            resultCode = 200;
            message = "Alarm Send Success";
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

function sendAlaramToOwner(userEmail,ownerEmail){
    const sql = 'select O.OwnerDeviceToken, Orders.OrderNum from Owners O LEFT OUTER JOIN Orders ON Orders.OwnerEmail = O.OwnerEmail where OwnerEmail = ? and UserEmail = ? and Orders.IsCompleted = false';
    const params = [userEmail, ownerEmail];

    connection.query(sql, params, function(err,result){
        if(err){
            console.log(err);
        }else{
            let ownerDeviceToken = result[0].OwnerDeviceToken;
            let orderNum = result[0].OrderNum;
            let fcmMessage = {
                notification:{
                    title: '오더프리',
                    body: `${orderNum}번 주문이 들어왔습니다. \n 음식 준비를 시작해주세요!`,
                },
                token : ownerDeviceToken
            };
            admin.messaging().send(fcmMessage)
                .then((response)=>{
                    console.log('successfully push notification',response);
                })
                .catch((error)=>{
                    console.log('Error sending push notification',error);
                });
            console.log("IsCompleted Update success");
        }
    });
}

//무엇을 export할지를 결정하는것 
module.exports = router;
