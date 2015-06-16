
// try it:
// curl -Fa=b -Fb=c http://127.0.0.1:3000/
var koa = require('koa');

var app = koa();

app.use(function*(next) {

  var contentType = this.get('content-type') || '';
  if (!~['DELETE', 'POST', 'PUT', 'PATCH'].indexOf(this.method) || !contentType.startsWith('multipart/form-data')) {
    yield* next;
    return;
  }

  var parser = multiparty(this.req);

  for(var promise of parser) {
    var field = yield promise;
    if (!field) break;
    console.log(field);
  }

  yield* next;
});

app.listen(3000);