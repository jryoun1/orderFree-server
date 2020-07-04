const mysql = require('mysql');
const express = require('express');
const router = express.Router();
const db_config = require('../db-config/db-config.json'); // db 설정 정보 모듈화

//mysql과의 연동 
const connection = mysql.createConnection({
    host: db_config.host,
    user: db_config.user,
    database: db_config.database,
    password: db_config.password,
    port: db_config.port
});

//가게 등록하는 부분
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


//회원탈퇴부분
router.post('/info/withdraw',function(req,res){
    const ownerEmail = req.body.ownerEmail;
    const ownerWithdraw = true; //회원탈퇴하면 true값으로 변경 default = 0(false)
    const trashOwnerEmail = '0@0' //탈퇴하면 email중복검사에서 해당 email을 사용할 수 있게 하기 위해 trash email id 입력
    const sql = 
    'update Owners set IsOwnerDeleted = ? , OwnerEmail =? where OwnerEmail = ?';
    const params = [ownerWithdraw, trashOwnerEmail, ownerEmail];

    connection.query(sql, params,function(err,result){
        let resultCode = 500;
        let message = "Server Error";

        if(err){
            console.log(err);
        }else{
            resultCode = 201;
            message = 'Account Deleted';    
        }
        res.json({
            'code' : resultCode,
            'message' : message
        });
    });
});

//무엇을 export할지를 결정하는것 
module.exports = router;
