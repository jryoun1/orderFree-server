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


//내 정보 수정에서 비밀번호 변경 (현재 비밀번호 입력 후 변경 버튼 클릭 시)
//이메일 주소 입력하면 db에서 해당하는 Owner의 OwnerSalt와 비밀번호 가져와서
//사용자가 입력한 것에 Salt값 연산후 OwnerPwd와 비교하여 일치하는지 확인 -- By 정민
router.post('/info/checkpwd', function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    const sql = 'select OwnerPwd, OwnerSalt from Owners where OwnerEmail = ?';

    connection.query(sql, ownerEmail,function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = 'Invalid Email';    
        }else if(result[0].OwnerPwd !== crypto.createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex")){
            resultCode = 400;
            message = 'Wrong Password';
        }else if(result[0].OwnerPwd === crypto.createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex")){
            resultCode = 200;
            message = 'Right Password';
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//개인 정보 수정에서 회원 탈퇴 부분 (계정삭제하기 버튼 클릭시)
router.post('/info/withdraw',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const ownerWithdraw = true; //회원탈퇴하면 true값으로 변경 default = 0(false)
    const trashOwnerEmail = null; //탈퇴하면 email중복검사에서 해당 email을 사용할 수 있게 하기 위해 trash email id 입력
    const sql = 
    'update Owners set IsOwnerDeleted = ? , OwnerEmail =? where OwnerEmail = ?';
    const params = [ownerWithdraw, trashOwnerEmail, ownerEmail];

    connection.query(sql, params,function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else{
            resultCode = 200;
            message = 'Account Deleted';    
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//판매 현황 확인 하는 부분 (기간 설정하고 조회버튼 클릭 시)
router.post('/sellstatus',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    var startDate = req.body.startDate;
    IntStartDate = parseInt(startDate);
    var endDate = req.body.endDate;
    IntEndDate = parseInt(endDate);
    const sql = 
    'select OrderedDate ,OrderNum, json_extract(ShoppingList,\'$."count"\') as count, json_extract(ShoppingList,\'$."price"\') as price from Orders where (OwnerEmail = ? ) and (OrderedDate between date(?) and (date(?)+1)) and IsCompleted = true order by OrderedDate';
    const params = [ ownerEmail, IntStartDate, IntEndDate];
    var resultArray = new Array(); 
    
    connection.query(sql,params, function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        console.log(`${IntStartDate} 기간과 ${IntEndDate} 기간 사이의 판매결과를 조회합니다.`);
        console.log(result);
        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "No Record Exists During Term";
        }else{
            console.log("클라이언트로 보내지는 Array 내용");
            for(var i = 0; i < result.length; i++){
                //쿼리 수행 결과를 한 쌍씩 object에 담고 object를 배열에 넣어줌 
                var resultJson = new Object();
                //var menu = result[i].menu.substring(1,result[i].menu.indexOf("\"",1));
                resultJson.orderedDate = result[i].OrderedDate;
                //resultJson.menu = menu;
                resultJson.orderNum = result[i].OrderNum;
                resultJson.count = result[i].count;
                resultJson.price = result[i].price;
                resultArray.push(resultJson);
            }
            resultCode = 200;
            message = "Send Sell Status";
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
    const userNum = req.body.userNum;
    const orderNum = req.body.orderNum;
    
    const sql = 'select UserDeviceToken from Users where userNum = ?';

    connection.query(sql, userNum, function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else if(result.length===0){
            resultCode = 400;
            message = "No matching Order";
        }else{
            updateIsCompleted(orderNum,userNum,ownerEmail);
            let userDeviceToken = result[0].UserDeviceToken;
            let fcmMessage = {
                notification:{
                    title: '오더프리',
                    body: '주문하신 상품이 준비완료되었습니다.'
                },
                token : userDeviceToken
            };
            admin.messaging().send(fcmMessage)
                .then((response)=>{
                    console.log('successfully push notification',response);
                })
                .catch((error)=>{
                    console.log('Error sending push notification',error);
                });
            
            resultCode = 200;
            message = "Message Send";
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

function updateIsCompleted(orderNum,userNum,ownerEmail){
    const sql = 'update Orders set IsCompleted = true where OrderNum = ? and UserNum = ? and OwnerEmail = ?';
    const params = [orderNum, userNum, ownerEmail];

    connection.query(sql, params, function(err,result){
        if(err){
            console.log(err);
        }else{
            console.log("IsCompleted Update success");
        }
    });
}


/**
 * glen 메인 화면에서 메뉴 등록 버튼 클릭시, 또는 메뉴 등록하고 나서 새로고침처럼 이동 시 
 * */
router.post('/menu/menuList', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    //const menuName = req.body.menuName;
    const sql = 
    'select json_extract(Menu,\'$."menuName"\') as menuName, json_extract(Menu,\'$."category"\') as category from Menus where OwnerEmail = ?';
    const params = [ownerEmail];

    console.log("menuList First log...!!!");
    console.log("menuList request : " + req);
    connection.query(sql, params, function (err, result) {
        console.log("Hi...!!!");
        let resultCode = 500;
        let message = "Server Error";
        var result_menuList = new Array();

        if (err) {
            console.log("Error occured!!! from searching menu list!!! ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            console.log("result : ", result);
            for (var i = 0; i < result.length; i++) {
                var resultJson_menuList = new Object();
                console.log("Index : " + i + "result[" + i + "]" + result[i]); 
                //이름에서 ""파싱해서 보내는 부분 by 정민 
                var menuName = result[i].menuName.substring(1,result[i].menuName.indexOf("\"",1));
                //jsonObject에 전송할 부분 담고, Array에 push 하는 부분 by 정민 
                resultJson_menuList.menuName = menuName;
                resultJson_menuList.category = result[i].category;
                result_menuList.push(resultJson_menuList);
                console.log(result_menuList[i]);
            }
            resultCode = 200;
            message = "Successfully searched menu";
        }
        res.json({
            result_menuList,
            'code': resultCode,
            'message': message
        });  
    });
});

/**
 * 메뉴상세보기. (메뉴 클릭했을 때)
 */
router.post('/menu/menuSpecification', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const menuName = req.body.menuName;
    const sql = 'select json_extract(Menu,\'$."menuName"\') as menuName, json_extract(Menu,\'$."category"\') as category, json_extract(Menu,\'$."imgURL"\') as imgURL, json_extract(Menu,\'$."price"\') as price, json_extract(Menu,\'$."info"\') as info from Menus where OwnerEmail = ? && json_extract(Menu, \'$."menuName"\') = ?';
    const params = [ownerEmail, menuName];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        var resultMenuSpecification = new Object();

        if (err) {
            console.log("Err occured!!! from searching menu list \"eachMenu\"!!! ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            console.log("메뉴 상세보기");
            
            //""파싱하는 부분 by 정민 
            var menuName = result[0].menuName.substring(1,result[0].menuName.indexOf("\"",1));
            //var imgURL = result[0].imgURL.substring(1,result[0].imgURL.indexOf("\"",1));
            var info = result[0].info.substring(1,result[0].info.indexOf("\"",1));
            //jsonObject에 전송할 부분 담는부분 by 정민 
            resultMenuSpecification.menuName = menuName;
            resultMenuSpecification.category = result[0].category;
            //resultMenuSpecification.imgURL = imgURL;
            resultMenuSpecification.price = result[0].price;
            resultMenuSpecification.info = info;

            resultCode = 200;
            message = "Successfully searched menu(eachMenu)";
            console.log(resultMenuSpecification);
        }
        res.json({
            resultMenuSpecification,
            'code': resultCode,
            'message': message
        });
    });
});




//무엇을 export할지를 결정하는것 
module.exports = router;
