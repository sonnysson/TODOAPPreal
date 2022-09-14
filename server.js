const express = require("express");
const app = express();

const MongoClient = require("mongodb").MongoClient;
app.set("view engine", "ejs");

//middleware
app.use("/public", express.static("public"));

var db;

MongoClient.connect(
  "mongodb+srv://admin:qwer1234@cluster0.qesibq1.mongodb.net/?retryWrites=true&w=majority",
  function (err, client) {
    db = client.db("todoapp");

    if (err) {
      return console.log(err);
    }

    app.listen(8080, function () {
      console.log("listening on port 8080!");
    });
  }
);

// body-parser = 요청 데이터 해석
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

app.get("/write", function (req, res) {
  res.sendFile(__dirname + "/write.html");
});

app.post("/add", function (req, res) {
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (err, result) {
      console.log(result.totalPost);
      var 총개시물갯수 = result.totalPost;

      db.collection("post").insertOne(
        { _id: 총개시물갯수 + 1, 제목: req.body.title, 날짜: req.body.date },
        function (err, res) {
          console.log("저장완료");
          //+ 콜렉션 토탈포스트 변경
          db.collection("counter").updateOne(
            { name: "게시물갯수" },
            { $inc: { totalPost: 1 } },
            function (error, result) {
              if (error) {
                return console.log(error);
              }
            }
          );
        }
      );
    }
  );
  res.send("전송완료");
});

app.get("/list", function (req, response) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      response.render("list.ejs", { posts: result });
    });
});

// 함수 내부 console.log 는  세미콜론 달것!
app.delete("/delete", function (require, response) {
  console.log(require.body);
  // 데이터 베이스 int로 변경
  require.body._id = parseInt(require.body._id);

  db.collection("post").deleteOne(require.body, function (error, result) {
    console.log("삭제완료");

    //응답코드 400 (요청 실패)
    //응답코드 500 (서버문제)
    //응답코드 200을 내보내기 (정상 수신) & message 도 같이 보냄
    response.status(200).send({ message: "성공했습니다." });
  });
});

// :id parameter 기능 함
app.get("/detail/:id", function (require, response) {
  //database 에서 id 찾아오기
  // require.params.id 요청중에서 파라미터 : id 라는 뜻
  db.collection("post").findOne(
    { _id: parseInt(require.params.id) },
    function (error, result) {
      // 데이터 꽃아 넣기
      console.log(result);
      response.render("detail.ejs", { data: result });
    }
  );
});
