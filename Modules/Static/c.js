/*|--minAjax.js--|
  |--(A Minimalistic Pure JavaScript Header for Ajax POST/GET Request )--|
  |--Author : flouthoc (gunnerar7@gmail.com)(http://github.com/flouthoc)--|
  |--Contributers : Add Your Name Below--|
  */
function initXMLhttp() {

    var xmlhttp;
    if (window.XMLHttpRequest) {
        //code for IE7,firefox chrome and above
        xmlhttp = new XMLHttpRequest();
    } else {
        //code for Internet Explorer
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    return xmlhttp;
}

function minAjax(config) {

    /*Config Structure
            url:"reqesting URL"
            type:"GET or POST"
            method: "(OPTIONAL) True for async and False for Non-async | By default its Async"
            debugLog: "(OPTIONAL)To display Debug Logs | By default it is false"
            data: "(OPTIONAL) another Nested Object which should contains reqested Properties in form of Object Properties"
            success: "(OPTIONAL) Callback function to process after response | function(data,status)"
    */

    if (!config.url) {

        if (config.debugLog == true)
            console.log("No Url!");
        return;

    }

    if (!config.type) {

        if (config.debugLog == true)
            console.log("No Default type (GET/POST) given!");
        return;

    }

    if (!config.method) {
        config.method = true;
    }


    if (!config.debugLog) {
        config.debugLog = false;
    }

    var xmlhttp = initXMLhttp();

    xmlhttp.onreadystatechange = function() {

        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

            if (config.success) {
                config.success(xmlhttp.responseText, xmlhttp.readyState);
            }

            if (config.debugLog == true)
                console.log("SuccessResponse");
            if (config.debugLog == true)
                console.log("Response Data:" + xmlhttp.responseText);

        } else {
            if (config.debugLog == true)
                console.log("FailureResponse --> State:" + xmlhttp.readyState + "Status:" + xmlhttp.status);
        }
    }

    var sendString = [],
        sendData = config.data;
    if( typeof sendData === "string" ){
        var tmpArr = String.prototype.split.call(sendData,'&');
        for(var i = 0, j = tmpArr.length; i < j; i++){
            var datum = tmpArr[i].split('=');
            sendString.push(encodeURIComponent(datum[0]) + "=" + encodeURIComponent(datum[1]));
        }
    }else if( typeof sendData === 'object' && !( sendData instanceof String || (FormData && sendData instanceof FormData) ) ){
        for (var k in sendData) {
            var datum = sendData[k];
            if( Object.prototype.toString.call(datum) == "[object Array]" ){
                for(var i = 0, j = datum.length; i < j; i++) {
                        sendString.push(encodeURIComponent(k) + "[]=" + encodeURIComponent(datum[i]));
                }
            }else{
                sendString.push(encodeURIComponent(k) + "=" + encodeURIComponent(datum));
            }
        }
    }
    sendString = sendString.join('&');

    if (config.type == "GET") {
        xmlhttp.open("GET", config.url + "?" + sendString, config.method);
        xmlhttp.send();

        if (config.debugLog == true)
            console.log("GET fired at:" + config.url + "?" + sendString);
    }
    if (config.type == "POST") {
        xmlhttp.open("POST", config.url, config.method);
        xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlhttp.send(sendString);

        if (config.debugLog == true)
            console.log("POST fired at:" + config.url + " || Data:" + sendString);
    }
}


function loaded() {
  window.Loaded = true;
  document.title = "[LOADED]";
}

if (document.all) {
  window.attachEvent('onload', loaded)//IE中 
}
else {
  window.addEventListener('load', loaded, false);//firefox 
} 


var map = {
  baidumap: /map.baidu.com/i,
  youku: /v.youku.com/i,
  baidusearch: /baidu.com/i
};

window.args = function(arr){
  var a = {};
  for(var i = 0; i < arr.length; i++){
    a[i] = JSON.stringify(arr[i]);
  }
  return a;
}

window.api = function(func, a, cb){
  minAjax({
    url:"//api.wi.fi/" + func,
    type:"POST",
    data:args(a),
    success: function(data){
      if(data.trim() !== "")
        return cb(undefined, JSON.parse(data))
    }
  });
}



function $$(name, props) {
  var t = document.createElement(name);
  for (var key in props) {
    t.setAttribute(key, props[key]);
  }
  return t;
}
window.$$ = $$;

window.isPC = !(/mobile/i.test(navigator.userAgent));
var head;

function init() {
  
  document.title = "[edge] " + document.title;
  
  head = document.getElementsByTagName("head")[0];

  head.appendChild($$("meta", {
    "charset": "UTF-8"
  }));
  head.appendChild($$("meta", {
    "http-equiv": "X-UA-Compatible"
  }));
  head.appendChild($$("meta", {
    "name": "renderer",
    "content": "webkit"
  }));
  window.isPC ? head.appendChild($$("meta", {
    "viewport": "width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale= 1.0"
  })) : void 0;
  head.appendChild($$("link", {
    "href": "//a.wi.fi/shared/fonts/font-awesome.css",
    "type": "text/css",
    "rel": "stylesheet"
  }));
}

init();

window.init = init;

for (var i in map) {
  if (map[i].test(window.location.href)) {
    head.appendChild($$("script", {
      "src": "//a.wi.fi/" + i + "/index.js"
    }));
    break;
  }
}