var ipp = require('ipp');
var uri = "http://192.168.1.29:631/ipp/printer";
var data = ipp.serialize({
    "operation":"Get-Printer-Attributes",
    "operation-attributes-tag": {
        "attributes-charset": "utf-8",
        "attributes-natural-language": "en",
        "printer-uri": uri
    }
});

ipp.request(uri, data, function(err, res){
    if(err){
        return console.log(err);
    }
    console.log(JSON.stringify(res,null,2));
});