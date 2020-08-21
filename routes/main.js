import { createConnection } from 'mysql';
const MysqlJson = require('mysql-json');
//import { MysqlJson } from 'mysql-json';
import { Router } from 'express';
const router = Router();
import { host as _host, user as _user, database as _database, password as _password, port as _port } from '../db-config/db-config.json'; // db 설정 정보 모듈화
import serviceAccount from '../db-config/fcm-serviceAccountKey.json';
import multer from 'multer';
import { createHash } from 'crypto'; //비밀번호 인증키 역할을 할 토큰 생성을 위한 모듈 
import multerS3, { AUTO_CONTENT_TYPE } from 'multer-s3';
import { extname } from 'path'; //파일명 중복을 막기위해서 사용
import { S3, config } from 'aws-sdk';
const region = 'ap-northeast-2';
import { initializeApp, credential as _credential, messaging } from "firebase-admin";

//mysql과의 연동 
const connection = createConnection({
    host: _host,
    user: _user,
    database: _database,
    password: _password,
    port: _port
});
/**
 * Glen
 */
const mysqlJson = new MysqlJson({
    host: _host,
    user: _user,
    database: _database,
    password: _password,
    port: _port
});
/**
 * Glen
 */

initializeApp({
    credential: _credential.cert(serviceAccount)
});

let s3 = new S3();
config.loadFromPath(__dirname + '/../db-config/awsconfig.json'); // aws 인증

// multer 미들웨어 등록
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "valueUp",
        key: function (req, file, cb) {
            let extension = extname(file.originalname);
            cb(null, Date.now().toString() + extension)
        },
        contentType: AUTO_CONTENT_TYPE,
        acl: 'public-read-write',
    }),
});

//메뉴 등록 및 수정하는 부분 (메뉴 등록 버튼 누를 때)
router.post('/menu/add', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    var menuName = req.body.menuName;
    var category = req.body.category;
    var imgURL = req.body.imgURL;
    var price = req.body.price;
    var info = req.body.info;
    var decisionNum = req.body.decisionNum;
    let resultCode = 500;
    let message = "Server Error";
<<<<<<< HEAD
    console.log(menuName);
    console.log(info + imgURL);
    /*
    
    let rawdata = fs.readFileSync(uploadPath);
    try {
        student = JSON.parse(rawdata);
        // emp = student.employee;
        gstr2recon = student.cptyRecons;
        finPeriod = student.finPeriod;
        //console.log('gstr2recon',gstr2recon);
        jsonData['finperiod'] = student['finperiod'];
        jsonData['cname'] = student.cptyRecons['cname'];
        jsonData['total'] = student.cptyRecons['totalCnt'];
        jsonData['matched'] = student.cptyRecons['matchedCnt'];
        jsonData['mismatched'] = student.cptyRecons['mismatchedCnt'];
    
    
        jsonData['onhold'] = student.cptyRecons['onHoldCnt'];
        jsonData['pendinginasp'] = student.cptyRecons['pendingCnt'];
        jsonData['availingstn'] = student.cptyRecons['avlGstnCnt'];
        jsonData['email'] = student.cptyRecons['cemail'];
        var database = mysql.createConnection({
            host: '192.168.1.1',
            port: '3306',
            user: 'root',
            password: 'password',
            database: 'ui_support'
        });
        database.connect(function (connectionError) {
            if (connectionError) {
                throw connectionError;
            }
            console.log('jsonData', jsonData);
            var sql = "INSERT INTO gstr2Recon(finperiod,cname,ctin,total,matched,mismatched,onhold,pendinginasp,availingstn,email) VALUES ('" + jsonData + "')";
            database.query(sql, function (queryError, queryResult) {
                if (queryError) {
                    throw queryError;
                }
            });
        });
    
    */
    if (decisionNum === 1) { //항목추가로 메뉴를 생성하는 경우 
        /*
        jsonData = {
            "category": category,
            "menuName": menuName,
            "imgURL": imgURL,
            "price": price,
            "info": info
        };
        */

        jsonData['category'] = req.body.category;
        jsonData['menuName'] = req.body.menuName;
        jsonData['imgURL'] = req.body.imgURL;
        jsonData['price'] = req.body.price;
        jsonData['info'] = req.body.info;
        /*
         // Insert new document with login=root, firstname=John, lastName=Doe, Age=45
          mysqlJson.insert('myTable', {
            login:'root',
            firstName:'John',
            lastName:'Doe',
            age:45
          }, function(err, response) {
            if (err) throw err;
            console.log(response);
          });
        */
        mysqlJson.insert('Menus', {
            OwnerEmail: ownerEmail,
            Menu: jsonData
        }, function (err, res) {
            if (err) {
                throw err;
            }
            console.log(res);
        });
        //VALUES ('" + jsonData + "')"
        const sql = "insert into Menus(OwnerEmail, Menu) values(?,'" + jsonData + "')";
        const params = [ownerEmail, jsonData];
        const sql =
            'insert into Menus(OwnerEmail, Menu) values ( ? , \'{ "category" : ?, "menuName" : \'?\', "price" : ? ,"imgURL" : ?, "info" : ? }\')';
        const params = [ownerEmail, category, menuName, price, imgURL, info];
        const params = [req.body.ownerEmail, req.body.category, req.body.menuName, req.body.price, req.body.imgURL, req.body.info];
        const params_glen = { ownerEmail: ownerEmail, category: category, menuName: menuName, price: price, imgURL: imgURL, info: info }
        //var sql = {email : email, name : name, pwd : pwd};

        connection.query(sql, params, function (err, result) {
            if (err) {
=======

    var Menu = new Object();
    Menu = {
        'menuName' : menuName,
        'category' :category,
        'price' : price,
        'imgURL' : imgURL,
        'info' : info
    }
    Menu = JSON.stringify(Menu)
    console.log(Menu);
    if(decisionNum === 1){ //항목추가로 메뉴를 생성하는 경우 
        const sql = 'insert into Menus(OwnerEmail, Menu) values ( ? ,  ? )';
        //'insert into Menus(OwnerEmail, Menu) values ( ? , \'{ "category" : "\'?" , "menuName" : ? , "price" : ? ,"imgURL" : ? , "info" : ? }\')';
        //const params = [ownerEmail,category, menuName, price, imgURL, info];
        const params = [ownerEmail, Menu];

        connection.query(sql, params, function(err, result){
            if(err){
>>>>>>> ed6a0dd5d8d50f47ce18d3648a284463644f0897
                console.log(err);
            } else {
                console.log("Menu Register Success");
                resultCode = 201;
                message = "Menu Registered";
            }
        });
    } else if (decisionNum === 2) { //생성된 메뉴 클릭하여 수정하는 경우 
        var menuOriginalName = req.body.menuOriginalName;
        const sql =
            'update Menus set Menu = json_set(Menu,\'$."menuName"\', ?), Menu = json_set(Menu,\'$."category"\',?), Menu = json_set(Menu,\'$."imgURL"\',?), Menu = json_set(Menu,\'$."price"\',?), Menu = json_set(Menu,\'$."info"\',?) where OwnerEmail = ? and json_extract(Menu,\'$."menuName"\') =?';
        const params = [menuName, category, imgURL, price, info, ownerEmail, menuOriginalName];

        connection.query(sql, params, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                console.log("Menu Modified Success");
                resultCode = 200;
                message = "Menu Modified";
            }
        });
    }
    res.json({
        'code': resultCode,
        'message': message
    });

});

//메뉴 정렬해서 보기 (분류별 정렬을 고르고 적용버튼 클릭시)
router.post('/menu/align', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const category = req.body.category;
    const sql =
        'select json_extract(Menu,\'$."menuName"\') as menuName , json_extract(Menu, \'$."category"\') as category from Menus where OwnerEmail = ? && json_extract(Menu,\'$."category"\') = ?';
    const params = [ownerEmail, category];
    var resultAlign = new Array();

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";

        if (err) {
            console.log(err);
        } else if (result.length === 0) {
            resultCode = 400;
            message = "No Menu Exist";
        } else {
            for (var i = 0; i < result.length; i++) {
                var resultJson = new Object(); //쿼리 수행 결과를 한 쌍씩 object에 담고 object를 배열에 넣어줌 
                var menuName = result[i].menuName.substring(1, result[i].menuName.indexOf("\"", 1));
                resultJson.menuName = menuName;
                resultJson.category = result[i].category;
                resultAlign.push(resultJson);
            }
            resultCode = 201;
            message = "Menu Aligned";
        }
        res.json({
            resultAlign,
            'code': resultCode,
            'message': message
        });
    });
});

//등록된 메뉴 삭제하는 부분 (항목 삭제를 클릭 시)
router.post('/menu/delete', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const menuName = req.body.menuName;
    const sql =
        'delete from Menus where (json_exxtract(Menu,\'$."ownerEmail"\') = ? and json_extract(Menu,\'$."menuName"\')=?)';
    const params = [ownerEmail, menuName];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = "Menu Deleted";
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});


//개인 정보 수정에서 가게 등록하는 부분 
router.post('/info/registore', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const ownerStoreName = req.body.ownerStoreName;
    const ownerStoreAddress = req.body.ownerStoreAddress;
<<<<<<< HEAD
    const sql =
        'update Owners set OwnerStoreName = ? , OwnerStoreAddress = ? where OwnerEmail = ?';
    const params = [ownerStoreName, ownerStoreAddress, ownerEmail];
=======
    const sql = 
    'update Owners set OwnerStoreName = ? , OwnerStoreAddress = ? where OwnerEmail = ?';
    const params = [ownerStoreName,ownerStoreAddress,ownerEmail];
    
    console.log(ownerEmail, ownerStoreAddress, ownerStoreName);
>>>>>>> ed6a0dd5d8d50f47ce18d3648a284463644f0897

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";

<<<<<<< HEAD
        if (err) {
=======
        console.log("hi");

        if(err){
>>>>>>> ed6a0dd5d8d50f47ce18d3648a284463644f0897
            console.log(err);
        } else if (result.length === 0) {
            resultCode = 400;
            message = 'Invalid Account';
<<<<<<< HEAD
        } else {
=======
        }else{
            console.log("here");
>>>>>>> ed6a0dd5d8d50f47ce18d3648a284463644f0897
            resultCode = 201;
            message = 'Store Registered';
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//메인화면에서 개인정보 수정 버튼 클릭시
router.post('/info', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const sql = 'select OwnerName, OwnerStoreAddress from Owners where OwnerEmail = ?';

    connection.query(sql, ownerEmail, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        if (err) {
            console.log(err);
        } else if (result.length !== 0) {
            resultCode = 200;
            message = "Load Success";
        } else if (result.length === 0) {
            resultCode = 400;
            message = "Invalid Email";
        }
        res.json({
            'code': resultCode,
            'message': message,
            'ownerName': result[0].OwnerName,
            'ownerStoreAddress': result[0].OwnerStoreAddress
        });
    });
});

//내 정보 수정에서 비밀번호 변경 (현재 비밀번호 입력 후 변경 버튼 클릭 시)
//이메일 주소 입력하면 db에서 해당하는 Owner의 OwnerSalt와 비밀번호 가져와서
//사용자가 입력한 것에 Salt값 연산후 OwnerPwd와 비교하여 일치하는지 확인 -- By 정민
router.post('/info/checkpwd', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const ownerPwd = req.body.ownerPwd;
    //const hashedPwd = crypto.createHash("sha512").update(ownerPwd + salt).digest("hex");
    const sql = 'select OwnerPwd, OwnerSalt from Owners where OwnerEmail = ?';

    connection.query(sql, ownerEmail, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        if (err) {
            console.log(err);
        } else if (result.length === 0) {
            resultCode = 400;
            message = 'Invalid Email';
        } else if (result[0].OwnerPwd !== createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex")) {
            resultCode = 400;
            message = 'Wrong Password';
        } else if (result[0].OwnerPwd === createHash("sha512").update(ownerPwd + result[0].OwnerSalt).digest("hex")) {
            resultCode = 200;
            message = 'Right Password';
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//개인 정보 수정에서 회원 탈퇴 부분 (계정삭제하기 버튼 클릭시)
router.post('/info/withdraw', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const ownerWithdraw = true; //회원탈퇴하면 true값으로 변경 default = 0(false)
    const trashOwnerEmail = null; //탈퇴하면 email중복검사에서 해당 email을 사용할 수 있게 하기 위해 trash email id 입력
    const sql =
        'update Owners set IsOwnerDeleted = ? , OwnerEmail =? where OwnerEmail = ?';
    const params = [ownerWithdraw, trashOwnerEmail, ownerEmail];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";

        if (err) {
            console.log(err);
        } else {
            resultCode = 200;
            message = 'Account Deleted';
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

//판매 현황 확인 하는 부분 (기간 설정하고 조회버튼 클릭 시)
router.post('/sellstatus', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    var startDate = req.body.startDate;
    IntStartDate = parseInt(startDate);
    var endDate = req.body.endDate;
    IntEndDate = parseInt(endDate);
    const sql =
        'select OrderedDate ,OrderNum, json_extract(ShoppingList,\'$."count"\') as count, json_extract(ShoppingList,\'$."price"\') as price from Orders where (OwnerEmail = ? ) and (OrderedDate between date(?) and (date(?)+1)) and IsCompleted = true order by OrderedDate';
    const params = [ownerEmail, IntStartDate, IntEndDate];
    var resultArray = new Array();

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        console.log(`${IntStartDate} 기간과 ${IntEndDate} 기간 사이의 판매결과를 조회합니다.`);
        console.log(result);
        if (err) {
            console.log(err);
        } else if (result.length === 0) {
            resultCode = 400;
            message = "No Record Exists During Term";
        } else {
            console.log("클라이언트로 보내지는 Array 내용");
            for (var i = 0; i < result.length; i++) {
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
            'code': resultCode,
            'message': message
        });
    });
});

//주문 목록확인에서 음식 준비 완료 눌렀을 때 
router.post('/orderlist/complete', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;

    const sql = 'select U.UserDeviceToken from Users U LEFT OUTER JOIN Orders O ON O.UserEmail = U.UserEmail where O.OrderNum = ?';

    connection.query(sql, orderNum, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";

        if (err) {
            console.log(err);
        } else if (result.length === 0) {
            resultCode = 400;
            message = "No matching Order";
        } else {
            updateIsCompleted(orderNum, ownerEmail);
            let userDeviceToken = result[0].UserDeviceToken;
            let fcmMessage = {
                notification: {
                    title: '오더프리',
                    body: '주문하신 상품이 준비완료되었습니다.'
                },
                token: userDeviceToken
            };
            messaging().send(fcmMessage)
                .then((response) => {
                    console.log('successfully push notification', response);
                })
                .catch((error) => {
                    console.log('Error sending push notification', error);
                });

            resultCode = 200;
            message = "Message Send";
        }
        res.json({
            'code': resultCode,
            'message': message
        });
    });
});

function updateIsCompleted(orderNum, ownerEmail) {
    const sql = 'update Orders set IsCompleted = true where OrderNum = ? and OwnerEmail = ?';
    const params = [orderNum, ownerEmail];

    connection.query(sql, params, function (err, result) {
        if (err) {
            console.log(err);
        } else {
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
                var menuName = result[i].menuName.substring(1, result[i].menuName.indexOf("\"", 1));
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
            var menuName = result[0].menuName.substring(1, result[0].menuName.indexOf("\"", 1));
            //var imgURL = result[0].imgURL.substring(1,result[0].imgURL.indexOf("\"",1));
            var info = result[0].info.substring(1, result[0].info.indexOf("\"", 1));
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

router.post('/menu/orderedList', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const sql = 'select OrderNum from Orders where OwnerEmail = ?';
    const params = [ownerEmail];
    console.log("before query");

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        var orderedList = new Array();
        console.log("query");

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
    const sql = 'select OrderNum, json_extract(ShoppingList,\'$."menu"\') as menuName, json_extract(ShoppingList,\'$."count"\') as count from Orders where OwnerEmail = ? and OrderNum = ?';
    const params = [ownerEmail, orderNum];

    connection.query(sql, params, function (err, result) {
        let resultCode = 500;
        let message = "Server Error";
        let resultArray = new Array();

        if (err) {
            console.log("Err occured!!! from searching Ordered List!!!, variable ownerEmail = " + ownerEamil + "ERROR CONTENT : " + err);
            return;
        }
        if (result.length === 0) {
            console.log("ERROR!!! result[0] is undefined!!!");
            return;
        }
        else {
            for (var i = 0; i < result.length; i++) {
                var resultJson = new Object();
                var menuName = result[0].menuName.substring(1, result[0].menuName.indexOf("\"", 1));
                resultJson.orderNum = result[i].OrderNum;
                resultJson.menuName = menuName;
                resultJson.count = result[i].count;
                resultArray.push(resultJson);
            }
            console.log("result : ", result);
            resultCode = 200;
            message = "Successfully searched orderedList(eachOrder)";
        }
        res.json({
            resultArray,
            'code': resultCode,
            'message': message
        });
    });
});

/*
router.post('/menu/orderList/previousOrder', function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;
    var previouseOrderNum = orderNum;
    var isSearched = false;
    var resultArray = new Array();
    let resultCode = 500;
    let message = "Server Error";

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
            const sql = 'select OrderNum, json_extract(ShoppingList,\'$."menu"\') as menuName, json_extract(ShoppingList,\'$."count"\') as count from Orders where OwnerEmail = ? and OrderNum = ? and IsCompleted = false';
            const params = [ownerEmail, previouseOrderNum];

            connection.query(sql, params, function (err, result) {              
                if (err) {
                    console.log("Err occured!!! from searching Ordered List(Previous Order)!!!, variable ownerEmail = " + ownerEamil + "variable orderNum = " + orderNum + "ERROR CONTENT : " + err);
                    return;
                }
                if (result[0] === undefined) {
                    console.log("Searching Previous Ordered Menu ...");
                    return;
                }
                else {
                    isSearched = true
                    console.log("Previous Order Load Success");
                    for(var i = 0; i < result.length; i++){
                        var resultJson = new Object();
                        var menuName = result[0].menuName.substring(1,result[0].menuName.indexOf("\"",1));
                        resultJson.orderNum = result[i].OrderNum;
                        resultJson.menuName = menuName;
                        resultJson.count = result[i].count;
                        resultArray.push(resultJson);
                    }
                    resultCode = 200;
                    message = "Successfully searched Previous order list";
                }
            });
        }
    }
    res.json({
        resultArray,
        'code': resultCode,
        'message': message
    });
    // const sql = 'select * from Orders where OwnerEmail = ? and OrderNum = ? and UserNum = ?';
    // const params = [ownerEmail, orderNum, userNum];
});
*/

/*
router.post('/menu/orderList/nextOrder', async function (req, res) {
    const ownerEmail = req.body.ownerEmail;
    const orderNum = req.body.orderNum;
    var nextOrderNum = orderNum
    var isSearched = false;
    var resultArray = new Array();
    let resultCode = 500;
    let message = "Server Error";

    for (var index = 0; index < orderNum; index++) {
        console.log('1') //
        if (isSearched) { // Error Handling.
            console.log('2') //
            console.log("Next Order Is NOT exist!!!")
            res.json({
                'code': 500,
                'message': "Next Order Is NOT exist"
            });
            return;
        }
        else {
            nextOrderNum = nextOrderNum + 1;
            const sql = 'select OrderNum, json_extract(ShoppingList,\'$."menu"\') as menuName, json_extract(ShoppingList,\'$."count"\') as count from Orders where OwnerEmail = ? and OrderNum = ? and IsCompleted = false';
            const params = [ownerEmail, nextOrderNum];
            console.log('3 nextOrderNum' + nextOrderNum) //
            await connection.query(sql, params, function (err, result) {
                if (err) {
                    console.log('4') //
                    console.log("Err occured!!! from searching Ordered List!!!, variable ownerEmail = " + ownerEmail + "variable orderNum = " + orderNum + "ERROR CONTENT : " + err);
                    return
                }
                if (result.length === 0) {
                    console.log('5') //
                    console.log("Searching Next Ordered Menu ...");
                    return
                }
                else {
                    console.log('6') //
                    isSearched = true;
                    //console.log("Next Order Load Success");
                    console.log('reuslt length :' + result.length);
                    for(var i = 0; i < result.length; i++){
                        console.log("for loop. Index i : " + i) //
                        var resultJson = new Object();
                        var menuName = result[0].menuName.substring(1,result[0].menuName.indexOf("\"",1));
                        resultJson.orderNum = result[i].OrderNum;
                        resultJson.menuName = menuName;
                        resultJson.count = result[i].count;
                        resultArray.push(resultJson);
                        console.log(resultJson);
                        console.log(resultArray);
                    }
                    console.log('for loop end. result array : ');
                    resultCode = 200;
                    message = "Successfully searched Next order list";
                }
            });
        }
    }
    res.json({
        resultArray,
        'code': resultCode,
        'message': message
    });
});
*/

//무엇을 export할지를 결정하는것
export default router;