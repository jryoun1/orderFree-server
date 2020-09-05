# orderFree-server
### 동국대학교 2020밸류업 참여 프로젝트
## 목차
- [프로젝트 주제](#프로젝트-주제)
- [서비스 구성도](#서비스-구성도)
- [서버와 DB 사용언어](#서버와-데이터베이스-사용-언어-및-정보)
- [DB ERD](#데이터베이스-ERD)
- [REST API 문서](#애플리케이션과의-통신을-위한-REST-API-문서)
- [서버 코드구조](#서버-코드구조)

## 프로젝트 주제
시각장애인분들의 키오스크 사용에 있어서의 불편함을 해결하고 접근성을 개선하기 위한 애플리케이션 기반 서비스 <br>
![subject_img](https://github.com/jryoun1/algorithm-study/blob/master/source/yeon/images/OrderFreeSubject.png)<br>

## 서비스 구성도
서비스 구성도는 아래의 사진과 같다. <br>
![service_Map](https://github.com/jryoun1/algorithm-study/blob/master/source/yeon/images/OrderFreeServiceMap.png)<br>
서비스 구성도를 보다시피 **점주용 애플리케이션**과 **유저용 애플리케이션** 그리고 **서버**가 존재한다. <br>
서버의 역할은 점주용과 유저용 애플리케이션에서의 사용자 정보들을 저장하며, 가게의 메뉴와 사용자로부터 들어오는 주문들도 저장한다. <br>

## 서버와 데이터베이스 사용 언어 및 정보
서버는 AWS에 EC2를 사용하며 언어로는 Node.js를 사용하였고, DB는 RDS서비스를 사용하며 언어로는 MySQL을 사용하였다. <br>
또한 이미지 저장을 위해서 S3도 사용하였으며, 유저와 점주용 애플리케이션간의 푸시 알림을 주고 받기 위해서 FCM을 사용하였다. <br>
이러한 부분에 대해서 설정하는 부분은 아래의 블로그를 통해서 정리해 두었다. <br>
[AWS에 EC2인스턴스 생성](https://blog.naver.com/jryoun1/221999717159) <br>
[AWS 탄력적 IP 사용하기](https://blog.naver.com/jryoun1/222043193776) <br>
[AWS에 RDS인스턴스 생성](https://blog.naver.com/jryoun1/222002658853) <br>
[RDS와 MySQLWorkbench 연동](https://blog.naver.com/jryoun1/222003976528) <br>
[Node.js와 MySQL 연동](https://blog.naver.com/jryoun1/222003976528) <br>
[FCM을 사용하여 푸시알림 보내기 - 1](https://blog.naver.com/jryoun1/222058760991) <br>
[FCM을 사용하여 푸시알림 보내기 - 2](https://blog.naver.com/jryoun1/222058831072) <br>

## 데이터베이스 ERD
![DB_ERD](https://github.com/jryoun1/algorithm-study/blob/master/source/yeon/images/dbtableERD.png)<br>

## 애플리케이션과의 통신을 위한 REST API 문서
#### 점주용 애플리케이션 REST API
![ownerAppRestApi](https://github.com/jryoun1/algorithm-study/blob/master/source/yeon/images/ownerappRestApi.png) <br>
#### 사용자용 애플리케이션 REST API 
![userAppRestApi](https://github.com/jryoun1/algorithm-study/blob/master/source/yeon/images/userappRestApi.png) <br>

## 서버 코드구조
```
server.js 
package.json
package-lock.json
routes(폴더)
|- owner.js
|- main.js
|- user.js
|- usermain.js
html(폴더)
|- daum_address.html
```
**server.js** 는 routes에 따라서 알맞은 라우터를 불러준다. <br>
또한 점주용 애플리케이션에서의 카카오 도로명주소찾기 api를 사용하여 서버에 요청하면 html 폴더 안에 있는 daum_address.html파일을 전송해준다. <br>
**routes폴더** 안에는 **점주용 애플리케이션**의 로그인, 회원가입, 이메일 중복확인, 이메일 찾기, 비밀번호 찾기 부분인 **owner.js** 와 <br>
**점주용 애플리케이션**의 주요기능인 메뉴등록, 수정, 주문목록확인, 개인정보수정 등과 관련된 **main.js** 이 있다. <br> 
또한 **사용자 애플리케이션**의 로그인, 회원가입, 이메일 중복확인, 이메일 찾기, 비밀번호 찾기 부분인 **user.js** 와 <br>
**사용자 애플리케이션**의 주요기능인 qr코드 인식, 메뉴 받아오기, 주문목록확인 등과 관련된 **usermain.js** 로 구성되어있다. <br>

## 

-----
아래의 링크는 점주용 애플리케이션과 유저용 애플리케이션의 코드 및 정보가 담겨있는 링크이다. <br>
[점주용 애플리케이션]() <br>
[유저용 애플리케이션]() <br>

