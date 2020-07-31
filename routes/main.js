const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화
const multer = require('multer');
const crypto = require('crypto'); //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
const multerS3 = require('multer-s3');
const path = require('path'); //파일명 중복을 막기위해서 사용
const AWS = require('aws-sdk');
const region = 'ap-northeast-2';

//mysql과의 연동 
const connection = mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    database: db_config.database,
    password: db_config.password,
    port: db_config.port
});

let s3 = new AWS.S3();
AWS.config.loadFromPath(__dirname + '/../db-config/awsconfig.json'); // aws 인증
// multer 미들웨어 등록
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "valueUp",
        key: function(req,file,cb){
            let extension = path.extname(file.originalname);
            cb(null, Date.now().toString()+ extension)
        },
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read-write',
    }),
});

//사진을 보냈을 때 받아서 s3로 저장하는부분??
//router.post('menu/add',upload.single("imgFile"),function(req,res,next){
//    console.log(req.file);
//    let url = req.location;
//    console.log(url);
//});

//메뉴 등록 및 수정하는 부분 (메뉴 등록 버튼 누를 때)
router.post('/menu/add',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    var menuName = req.body.menuName;
    var category = req.body.category;
    var imgURL = req.body.imgURL;
    var price = req.body.price;
    var info = req.body.info;
    var decisionNum = req.body.decisionNum;
    
    if(decisionNum === 1){ //항목추가로 메뉴를 생성하는 경우 
        const sql = 
        'insert into Menus(OwnerEmail, Menu) values ( ? , \'{ "category" : ?, "menuName" : ?, "price" : ? ,"imgURL" : ?, "info" : ? }\')';
        const params = [ownerEmail,category,menuName, price, imgURL,info];

        connection.query(sql, params, function(err, result){
            let resultCode = 500;
            let message = "Server Error";
            if(err){
                console.log(err);
            }else{
                resultCode = 201;
                message = "Menu Registered";
            }
        });
    }else if(decisionNum === 2){ //생성된 메뉴 클릭하여 수정하는 경우 
        var menuOriginalName = req.body.menuOriginalName;
        const sql = 
        'update Menus set Menu = json_set(Menu,\'$."menuName"\', ?), Menu = json_set(Menu,\'$."category"\',?), Menu = json_set(Menu,\'$."imgURL"\',?), Menu = json_set(Menu,\'$."price"\',?), Menu = json_set(Menu,\'$."info"\',?) where OwnerEmail = ? and json_extract(Menu,\'$."menuName"\') =?';
        const params = [menuName,category, imgURL, price, info, ownerEmail, menuOriginalName];

        connection.query(sql, params, function(err, result){
            let resultCode = 500;
            let message = "Server Error";
            if(err){
                console.log(err);
            }else{
                resultCode = 200;
                message = "Menu Modified";
            }
        });
    }
    res.json({
        'code' : resultCode,
        'message' : message
    });
    
});

//메뉴 정렬해서 보기 (분류별 정렬을 고르고 적용버튼 클릭시)
router.post('/menu/align',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const category = req.body.category;
    const sql = 
    'select json_extract(Menu,\'$."menuName"\'), json_extract(Menu, \'$."category"\') from Menus where json_extract(Menu,\'$."ownerEmail"\') = ? && json_extract(Menu,\'$."category"\') = ?';
    const params = [ownerEmail,category];
    var resultArray = new Array(); 

    connection.query(sql, params, function(err, result){
        let resultCode = 500;
        let message = "Server Error";
        
        if(err){
            console.log(err);
        }else if(result.length === 0){
            resultCode = 400;
            message = "No Menu Exist";
        }else{
            for(var i = 0; i < result.length; i++){
                var resultJson = new Object(); //쿼리 수행 결과를 한 쌍씩 object에 담고 object를 배열에 넣어줌 
                resultJson.menuName = result[i].menuName;
                resultJson.category = result[i].category;
                resultArray.push(resultJson);
            }
            resultCode = 201;
            message = "Menu Aligned";
        }
        res.json({
            resultArray,
            'code' : resultCode,
            'message' : message
        });
    });
});

//등록된 메뉴 삭제하는 부분 (항목 삭제를 클릭 시)
router.post('/menu/delete',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const menuName = req.body.menuName;
    const sql = 
    'delete from Menus where (json_exxtract(Menu,\'$."ownerEmail"\') = ? and json_extract(Menu,\'$."menuName"\')=?)'; 
    const params = [ownerEmail,menuName];

    connection.query(sql, params, function(err, result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else{
            resultCode = 200;
            message = "Menu Deleted";
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});


//개인 정보 수정에서 가게 등록하는 부분 
router.post('/info/registore',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const ownerStoreName = req.body.ownerStoreName;
    const ownerStoreAddress = req.body.ownerStoreAddress;
    const sql = 
    'update Owners set OwnerStoreName = ? , OwnerStoreAddress = ? where OwnerEmail = ?';
    const params = [ownerStoreName,ownerStoreAddress,ownerEmail];

    connection.query(sql, params,function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else if(result.length===0){
            resultCode = 400;
            message = 'Invalid Account';
        }else{
            resultCode = 201;
            message = 'Store Registered';    
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//메인화면에서 개인정보 수정 버튼 클릭시
router.post('/info',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const sql = 'select OwnerName, OwnerStoreAddress from Owners where OwnerEmail = ?';
    
    connection.query(sql, ownerEmail, function(err,result){
        let resultCode = 500;
        let message = "Server Error";
        if(err){
            console.log(err);
        }else if(result.length !== 0){
            resultCode = 200;
            message = "Load Success";
        }else if(result.length === 0){
            resultCode = 400;
            message = "Invalid Email";
        }
        res.json({
            'code' : resultCode,
            'message' : message,
            'ownerName' : result[0].OwnerName,
            'ownerStoreAddress' : result[0].OwnerStoreAddress
        });
    });
});

//내 정보 수정에서 비밀번호 변경 (현재 비밀번호 입력 후 변경 버튼 클릭 시)
//이메일 주소 입력하면 db에서 해당하는 Owner의 OwnerSalt와 비밀번호 가져와서
//사용자가 입력한 것에 Salt값 연산후 OwnerPwd와 비교하여 일치하는지 확인 -- By 정민
router.post('/info/checkpwd', function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    //const hashedPwd = crypto.createHash("sha512").update(ownerPwd + salt).digest("hex");
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
    'select OrderedDate ,json_extract(ShoppingList,\'$."menu"\') as menu, json_extract(ShoppingList,\'$."count"\') as count, json_extract(ShoppingList,\'$."price"\') as price from Orders where (OwnerEmail = ? ) and (OrderedDate between date(?) and (date(?)+1)) and IsCompleted = true order by OrderedDate';
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
                var menu = result[i].menu.substring(1,result[i].menu.indexOf("\"",1));
                resultJson.orderedDate = result[i].OrderedDate;
                resultJson.menu = menu;
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
    const userDeviceToken = req.body.userTargetToken;
    const sql = 'update Orders set IsCompleted = true where OrderNum = ? and UserNum = ? and OwnerEmail = ?';
    const params = [orderNum, userNum, ownerEmail];

    connection.query(sql, params, function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else if(result.length===0){
            resultCode = 400;
            message = "No matching Order";
        }else{
            sendPushAlarm(userDeviceToken, orderNum);
            resultCode = 200;
            message = "Message Send";
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

function sendPushAlarm(userDeviceToken, orderNum){
    const title = '오더프리 알림입니다.';
    const message = `${orderNum}번 고객님, 음식이 준비되었습니다.`;
    const applicationId = '';
    const action = 'OPEN_APP'; //push message 클릭했을 시 어플 다시 열기(foreground로 가져오기)
    const priority = 'high'; 
    const ttl = 30;
    const silent = false;

    const messageRequest = {
        'Addresses': {
          [userDeviceToken]: {
            'ChannelType' : 'GCM'
          }
        },
        'MessageConfiguration': {
          'GCMMessage': {
            'Action': action,
            'Body': message,
            'Priority': priority,
            'SilentPush': silent,
            'Title': title,
            'TimeToLive': ttl,
          }
        }
      };

    // Specify that you're using a shared credentials file, and specify the
    // IAM profile to use.
    const credentials = new AWS.SharedIniFileCredentials({ profile: 'default' });
    AWS.config.credentials = credentials;
    // Specify the AWS Region to use.
    AWS.config.update({ region: region });

    //Create a new Pinpoint object.
    const pinpoint = new AWS.Pinpoint();
    const params = {
    "ApplicationId": applicationId,
    "MessageRequest": messageRequest
    };

    // Try to send the message.
    pinpoint.sendMessages(params, function(err, data) {
    if (err) console.log(err);
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
            //result_menuList = result; // 이거 반복문 돌려줘야함. 객체 여러개 넘어올수도 있기 떄문에. 메뉴 여러개면 여러번임;
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
    const sql = 'select * from Menus where json_extract(Menu,\'$."ownerEmail"\') = ? && json_extract(Menu, \'$."menuName"\') = ?';
    const params = [ownerEmail, menuName];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        // var result_menuSpecification;

        if (err) {
            console.log("Err occured!!! from searching menu list \"eachMenu\"!!! ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            console.log("result : ", result);
            // result_menuSpecification = result;
            // console.log("result_menuList_eachMenu", result_menuSpecification);
            resultCode = 200;
            message = "Successfully searched menu(eachMenu)";
        }
        res.json({
            result,
            'code': resultCode,
            'message': message
        });
    });
});

router.post('/menu/orderedList', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const sql = 'select * from Orders where OwnerEmail = ?';
    const params = [ownerEmail];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        var orderedList = new Array();

        if (err) {
            console.log("Err occured!!! from searching Ordered List!!!, variable ownerEmail = " + ownerEamil + "ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            console.log("result : ", result);
            for (var i = 0; i < result.length; i++) {
                var resultJson_orderedList = new Object();
                console.log("Index : " + i + "result[" + i + "]" + result[i]);
                resultJson_orderedList = result[i]
                orderedList.push(resultJson_orderedList)
            }
            resultCode = 200;
            message = "Successfully searched orderedList";
        }
        res.json({
            orderedList,
            'code': resultCode,
            'message': message
        });
    });
});

router.post('/menu/orderedListSpecification', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;
    const userNum = req.body.userNum;
    const sql = 'select * from Orders where OwnerEmail = ? and OrderNum = ? and UserNum = ?';
    const params = [ownerEmail, orderNum, userNum];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        let resultJson = new JSON();

        if (err) {
            console.log("Err occured!!! from searching Ordered List!!!, variable ownerEmail = " + ownerEamil + "ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            console.log("result : ", result);
            resultJson = result[0];
            resultCode = 200;
            message = "Successfully searched orderedList(eachOrder)";
        }
        res.json({
            resultJson,
            'code': resultCode,
            'message': message
        });
    });
});

router.post('/menu/orderList/previousOrder', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;
    const userNum = req.body.userNum;
    var previouseOrderNum = orderNum;
    var isSearched = false;

    for (var index = 0; index < orderNum; index++) {
        if (previouseOrderNum === 0 && !isSearched) {
            console.log("Previous Order Is NOT exist!!!")
            res.json({
                'code': 500,
                'message': "Previous Order Is NOT exist"
            })
            return;
        }// Async 처리 가능하도록 하기.
        else {
            previouseOrderNum = previouseOrderNum - 1;
            const sql = 'select * from Orders where OwnerEmail = ? and OrderNum = ? and UserNum = ?';
            const params = [ownerEmail, previouseOrderNum, userNum];
        }

        connection.query(sql, params, function (err, result) {
            let resultCode = 500;
            let message = "Server Error";
            var result_orderedList_previousOrder = new JSON();

            if (err) {
                console.log("Err occured!!! from searching Ordered List(Previous Order)!!!, variable ownerEmail = " + ownerEamil + "variable orderNum = " + orderNum + "ERROR CONTENT : " + err);
                return;
            }
            if (result[0] == undefined) {
                console.log("ERROR!!! result[0] is undefined!!!");
                return;
            }
            else {
                isSearched = true
                console.log("result : ", result);
                result_orderedList_previousOrder = result;
                resultCode = 200;
                message = "Successfully searched Previous order list";
            }
            res.json({
                result_orderedList_previousOrder,
                'code': resultCode,
                'message': message
            });
        });
    }
    // const sql = 'select * from Orders where OwnerEmail = ? and OrderNum = ? and UserNum = ?';
    // const params = [ownerEmail, orderNum, userNum];


});

/**
 * 
 */
router.post('/menu/orderList/nextOrder', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;
    const userNum = req.body.userNum;
    var nextOrderNum = orderNum
    var isSearched = false;

    for (var index = 0; index < orderNum; index++) {
        if (nextOrderNum === 0 && !isSearched) { // Error Handling.
            console.log("Next Order Is NOT exist!!!")
            res.json({
                'code': 500,
                'message': "Next Order Is NOT exist"
            })
            return
        }
        else {
            isSearched = true
            nextOrderNum = nextOrderNum + 1
            const sql = 'select * from Orders where OwnerEmail = ? and OrderNum = ? and UserNum = ?';
            const params = [ownerEmail, nextOrderNum, userNum];
        }

        connection.query(sql, params, function (err, result) {
            let resultCode = 500;
            let message = "Server Error";
            var result_orderedList_nextOrder = new JSON();

            if (err) {
                console.log("Err occured!!! from searching Ordered List!!!, variable ownerEmail = " + ownerEamil + "variable orderNum = " + orderNum + "ERROR CONTENT : " + err);
                return
            }
            if (result.length === 0) {
                console.log("ERROR!!! result[0] is undefined!!!");
                return
            }
            else {
                console.log("result : ", result);
                result_orderedList_nextOrder = result;
                resultCode = 200;
                message = "Successfully searched Next order list";
            }
            res.json({
                result_orderedList_nextOrder,
                'code': resultCode,
                'message': message
            });
        });

        if (result.IsCompleted == true) {
            isSearched = false
            continue
        }
    }
});
/** */

//무엇을 export할지를 결정하는것 
module.exports = router;
