const express = require('express');
const app = express();

const MongoClient = require('mongodb').MongoClient;
app.set('view engine','ejs');

var db;

MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.qesibq1.mongodb.net/?retryWrites=true&w=majority',function(err,client){

    db=client.db('todoapp');

    if(err){
        return console.log(err)
    }

    app.listen(8080, function () {
        console.log('listening on port 8080!');
      });

})

// body-parser = 요청 데이터 해석
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));


app.get('/',function(req,res){
    res.sendFile(__dirname+'/index.html')
});

app.get('/write',function(req,res){
    res.sendFile(__dirname+'/write.html')
});

app.post('/add',function(req,res){
    db.collection('counter').findOne({name:'게시물갯수'},function(err,result){
        console.log(result.totalPost)
        var 총개시물갯수 = result.totalPost;

        db.collection('post').insertOne({_id:총개시물갯수+1, 제목:req.body.title,날짜:req.body.date},function(err,res){
            console.log('저장완료');
            //+ 콜렉션 토탈포스트 변경
            db.collection('counter').updateOne({name:'게시물갯수'},{$inc : {totalPost:1}},function(error,result){
                if(error){return console.log(error)}
            })
        });
    });
    res.send('전송완료')
});



app.get('/list',function(req,response){
    db.collection('post').find().toArray(function(err,result){
        console.log(result)
        response.render('list.ejs',{posts: result});
    })
})