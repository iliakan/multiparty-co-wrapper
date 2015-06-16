const multiparty = require('multiparty');

module.exports = function* parse(req) {

  var form = new multiparty.Form();

  // Promises execute asynchronously always, 1 promise handles 1 event
  // Events may come in batches, so I queue them
  var formEventQueue = [];

  function queue(event) {
    //console.log(event);
    formEventQueue.push(event);
  }

  function onField(name, value) {
    queue({type: 'field', name, value});
  }

  function onPart(part) {
    queue({type: 'part', name: part.filename, value: part});
  }

  function onError(error) {
    queue({type: 'error', error});
  }

  function onClose() {
    queue({type: 'close'});
  }



  form
    .on('field', onField)
    .on('part', onPart)
    .on('error', onError)
    .on('close', onClose);

  process.nextTick(function() {
    form.parse(req);
  });

  var parseMoreFields = true;

  while (parseMoreFields) {
    //console.log("new promise");
    yield new Promise(function(resolve, reject) {

      // if an event exists - process it
      if (formEventQueue.length) {
        handleFormEvent();
      } else {
        // otherwise wait for any
        form
          .on('field', onEvent)
          .on('part', onEvent)
          .on('error', onEvent)
          .on('close', onEvent);
      }

      function onEvent() {
        form
          .removeListener('field', onEvent)
          .removeListener('part', onEvent)
          .removeListener('error', onEvent)
          .removeListener('close', onEvent);
        handleFormEvent();
      }

      function handleFormEvent() {
        var event = formEventQueue.shift();
        //console.log("HANDLE", event);
        switch(event.type) {
        case 'field':
        case 'part':
          resolve(event);
          break;
        case 'error':
          parseMoreFields = false;
          reject(event.error);
          break;
        case 'close':
          parseMoreFields = false;
          resolve();
          break;
        }
      }

    });
  }

};

