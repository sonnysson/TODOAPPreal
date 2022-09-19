const express = require("express");
const app = express();

const MongoClient = require("mongodb").MongoClient;

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

app.set("view engine", "ejs");

//middleware
app.use("/public", express.static("public"));

require("dotenv").config();

var db;

MongoClient.connect(process.env.DB_URL, function (err, client) {
  db = client.db("todoapp");

  if (err) {
    return console.log(err);
  }

  app.listen(process.env.PORT, function () {
    console.log("listening on port 8080!");
  });
});

// body-parser = 요청 데이터 해석
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function (req, response) {
  response.render("index.ejs", {});
});

app.get("/write", function (req, response) {
  response.render("write.ejs", {});
});

app.get("/list", function (req, response) {
  db.collection("post")
    .find()
    .toArray(function (err, result) {
      console.log(result);
      response.render("list.ejs", { posts: result });
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

app.get("/edit/:id", function (require, response) {
  db.collection("post").findOne(
    { _id: parseInt(require.params.id) },
    function (error, result) {
      response.render("edit.ejs", { post: result });
    }
  );
});

app.put("/edit", function (require, result) {
  db.collection("post").updateOne(
    { _id: parseInt(require.body.id) },
    { $set: { 제목: require.body.title, 날짜: require.body.date } },
    function () {
      console.log("수정완료");
      response.redirect("/list");
    }
  );
});

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const { response } = require("express");

//미들웨어 / 웹 서버는 요청-응답해주는 머신
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.post("/add", function (req, res) {
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (err, result) {
      console.log(result.totalPost);

      var 총개시물갯수 = result.totalPost;

      var post = {
        _id: 총개시물갯수 + 1,
        제목: req.body.title,
        날짜: req.body.date,
        작성자: req.user.id,
      };

      db.collection("post").insertOne(post, function (err, res) {
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
      });
    }
  );
  console.log("전송완료");
  res.redirect("/write");
});

// 함수 내부 console.log 는  세미콜론 달것!
app.delete("/delete", function (require, response) {
  console.log(require.body);
  // 데이터 베이스 int로 변경
  require.body._id = parseInt(require.body._id);

  var 삭제할데이터 = { _id: require.body._id, 작성자: require.user._id };

  db.collection("post").deleteOne(삭제할데이터, function (error, result) {
    console.log("삭제완료");
    if (error) {
      console.log(error);
    }
    //응답코드 400 (요청 실패)
    //응답코드 500 (서버문제)
    //응답코드 200을 내보내기 (정상 수신) & message 도 같이 보냄
    response.status(200).send({ message: "성공했습니다." });
  });
});

//login 으로 접속을하면 login ejs 띄우기
app.get("/login", function (require, response) {
  response.render("login.ejs");
});

app.post(
  "/login",
  passport.authenticate("local", {
    // 실패시 이동할 페이지
    failureRedirect: "/fail",
    //성공시
  }),
  function (require, response) {
    // 성공시 이동할 페이지
    response.redirect("/");
  }
);

app.get("/mypage", 로그인했니, function (require, response) {
  console.log(require.user);
  response.render("mypage.ejs", { 사용자: require.user });
});

// 미들 웨어 로그인 응답.유저가 있는지 확인
function 로그인했니(require, response, next) {
  if (require.user) {
    next();
  } else {
    response.send("로그인 안하셨는데요");
  }
}

// local strategy 인증 방식
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",

      // 로그인후 세션으로 저장할 것인지
      session: true,
      // 아이디/비번 말고도 다른 정보 검증시
      passReqToCallback: false,
    },
    function (inputId, inputPw, done) {
      //console.log(입력한아이디, 입력한비번);

      // login 에 아이디중에 입력한 입력값이 있는지?
      db.collection("login").findOne({ id: inputId }, function (error, result) {
        //없을시 에러 리턴
        if (error) return done(error);
        // 값이 없을시 메세지 전송
        if (!result)
          return done(null, false, { message: "존재하지않는 아이디요" });
        if (inputPw == result.pw) {
          return done(null, result);
          // 아이디는 있는데 비밀번호는
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

// 유저 아이디 세션 시리얼로 변경
// id 를 이용해서 세션을 저장시키는 코드 / 로그인시 발동
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  db.collection("login").findOne({ id: id }, function (error, result) {
    done(null, result);
  });
});

app.post("/register", function (require, response) {
  db.collection("login").insertOne(
    { id: require.body.id, pw: require.body.pw },
    function (error, result) {
      response.redirect("/");
    }
  );
});

//binary search
app.get("/search", (require, response) => {
  var 검색조건 = [
    {
      $search: {
        index: "titleSearch",
        text: {
          query: require.query.value,
          path: ["제목"], // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
        },
      },
    },
    // 아이디 순으로 정렬
    { $sort: { _id: 1 } },
    // 검색값 10 개만
    { $limit: 10 },
    //1 이면 가져오고 0 은 안가져온다 score 는 검색 점수
    { $project: { 제목: 1, _id: 0, score: { $meta: "searchScore" } } },
  ];

  db.collection("post")
    .aggregate(검색조건)
    .toArray((error, result) => {
      console.log(result);
      response.render("search.ejs", { post: result });
    });
});
