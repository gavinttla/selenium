  var prompt = require('prompt');
console.log('here1');
  prompt.start();

console.log('here2');
    prompt.start();
    var schema = {
        properties: {
            action: {
                description: 'Are you want to continue search the rest of pages? [y/n]',
                type: 'string',
                required: true
            }
        }
    };
    prompt.get(schema, function (err, result) {
        if (err) { return onErr(err); }
        if(result.action.toLowerCase() == 'y'){
            console.log('continue serach');
        }else if(result.action.toLowerCase() == 'n'){
            process.exit();
        }

    });
console.log('here3');
  function onErr(err) {
    console.log(err);
    return 1;
  }