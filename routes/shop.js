// 다른 파일이나 라이브러리 여기에 첨부하겠씁니다.

var router = require('express').Router();

router.get('/shirts',function(요청,응답){
    응답.send('셔츠파는페이지입니다.');
});
  
router.get('/pants',function(요청,응답){
    응답.send('바지 파는 페이지입니다.');
});

//module.exports= 내보낼 변수명
// require('파일경로')
module.exports = router;