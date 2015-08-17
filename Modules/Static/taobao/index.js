var KEYREG = {
    printer: /打印/i,
    device: /设备/i,
    light: /灯/i,
    pc: /电脑/i,
    mobile: /手机/i
}
var getKEYOBJ = function(reqObj) {
    var KEYOBJ = {};
    if (reqObj) {
        if (isPC) {
            KEYOBJ["kw"] = reqObj.wd;
            KEYOBJ["isPC"] = true;
        } else {
            KEYOBJ["kw"] = reqObj.q;
            KEYOBJ["isPC"] = false;
        }
    } else {
        KEYOBJ["kw"] = $("#kw").val();
        KEYOBJ["isPC"] = true;
    }
    return KEYOBJ;
};

function isEmptyObject(o) {
    for (var n in o) {
        return false;
    }
    return true;
}
var include_js = function(path) {
    var sobj = document.createElement('script');
    sobj.type = "text/javascript";
    sobj.src = path;
    var headobj = document.getElementsByTagName('head')[0];
    headobj.appendChild(sobj);
}


var findDevice = function(KeyWord) {
    var promise = new Promise(function(resolve, reject) {
        $.post("//API.wi.fi/device/all")
            .done(function(res) {
                var tmpArr = [];
                var deviceList = res.result;
                if (KeyWord === "device") {
                    for (var Device in deviceList) {
                        if (deviceList[Device]["classes"]) {
                            if (isEmptyObject(deviceList[Device]["classes"])) continue;
                            tmpArr.push(deviceList[Device]);
                            console.log("deviceList[Device][]", deviceList[Device]["classes"]);
                        }
                    }
                }
                if (KeyWord === "printer") {
                    for (var Device in deviceList) {
                        if (deviceList[Device]["classes"]) {
                            if (deviceList[Device]["classes"][KeyWord] && deviceList[Device]["actions"]["print"]) {
                                tmpArr.push(deviceList[Device]);
                            }
                        }
                    }
                }
                console.log(tmpArr);
                resolve(tmpArr);
            });
    });
    return promise;
}
var getPrinterAttr = function(originPrinterArr) {
    var PrinterArr = [];
    for (var i = 0, length1 = originPrinterArr.length; i < length1; i++) {
        var Printer = {}
        var printerAttr = originPrinterArr[i].attributes;

        var printerIpp = printerAttr["printer.ipp"]["value"];
        if (printerAttr["images"]) {
            //得到打印机图片
            Printer["printer_mainImg"] = "//resource.wi.fi/Assets/" + printerAttr["images"]["value"][1];
        } else {
            Printer["printer_mainImg"] = printerIpp["printer-icons"][1];
        }

        //打印机driver
        var printDriver = originPrinterArr[i].actions.print;

        Printer["printer_driver"] = [];
        for (var key in printDriver) {
            Printer["printer_driver"].push(key);
        }


        //打印机状态 "0表示离线"
        Printer["state"] = originPrinterArr[i].state;
        //打印机ID
        Printer["printer_ID"] = originPrinterArr[i].id;
        //得到打印机型号
        Printer["printer_model"] = originPrinterArr[i].attributes.model.value;
        //得到打印机名称
        Printer["printer_name"] = printerIpp["printer-name"];
        //打印机墨盒的颜色
        Printer["marker_colors"] = printerIpp["marker-colors"];
        //得到总墨量
        Printer["printer_rice"] = printerIpp["marker-high-levels"];
        //现在的墨量
        Printer["printer_current"] = printerIpp["marker-levels"];
        //告警墨量
        Printer["printer_warn"] = printerIpp["marker-low-levels"];
        //墨盒型号
        Printer["printer_markerName"] = printerIpp["marker-names"];

        PrinterArr.push(Printer);
    }
    return PrinterArr;
}
var getRequest = function(thisHref) {
    var url = thisHref; //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.substr(1);
        strs = str.split("&");
        for (var i = 0; i < strs.length; i++) {
            theRequest[strs[i].split("=")[0]] = (strs[i].split("=")[1]);
        }
    }
    return theRequest;
};

function searchKeyWordMap(kObj) {
    for (var key in KEYREG) {
        if (KEYREG[key].test(kObj["kw"])) {
            kObj["key"] = key;
            console.log(key);
            keyWordMap[key](kObj);
            break;
        }

    }
}

function getMobTemp(printerArr) {
    var max = printerArr[0].printer_rice[0];
    var maxPX = 50;
    var thisPX = maxPX / max;
    for (var i = 0, length1 = printerArr.length; i < length1; i++) {
        console.log(printerArr[i].state);
        if (printerArr[i].state === 0) continue;
        (function() {
            var strVar = "";
            strVar += "<li style=\"font-family: Microsoft Yahei UI Light, Microsoft Yahei UI, Helvetica, Sans-serif; display:none;background-color:#fff;opacity:0;transition:all .5s cubic-bezier(0.23, 1, 0.32, 1) 0ms ;text-align:left;border:0 solid #ececec;border-radius:0;overflow:hidden;\" id=\"M_container\">";
            strVar += "<div>";
            strVar += " <div class=\"list-item\">";
            strVar += "     <div class=\"p\">";
            strVar += "         <a href=\"javascript:void(0);\" title=\"\"><img class=\"p-pic\" src=\"{{imgSrc}}\" style=\"visibility:visible\"><\/a>";
            strVar += "     <\/div>";
            strVar += "     <div class=\"d\">";
            strVar += "         <div>";
            strVar += "             <a title=\"\" herf=\"javascript:void(0)\">";
            strVar += "             <h3 class='d-title'>";
            strVar += "                 {{printer_modal}}";
            strVar += "             <\/h3>";
            strVar += "             <\/a>";
            strVar += "             <div id='markerCon' style=\"display:inline-block;height:50px;overflow:hidden\">";
            strVar += "             <\/div>";
            strVar += "         <\/div>";
            strVar += "     <\/div>";
            strVar += " <\/div>";
            strVar += " <div style=\"padding:0 10px;margin-top:10px\">";
            strVar += "     <ul id='detail'>";
            strVar += "     <\/ul>";
            strVar += " <\/div>";
            strVar += "<\/div>";
            strVar += "<\/li>";

            //打印机墨盒的颜色
            var colors = printerArr[i]["marker_colors"];
            //得到总墨量
            var rice = printerArr[i]["printer_rice"];
            //现在的墨量
            var current = printerArr[i]["printer_current"];
            //告警墨量
            var warn = printerArr[i]["printer_warn"];
            //墨盒型号
            var markerName = printerArr[i]["printer_markerName"];
            var markers = [];
            var warningMarkers = [];
            var upmarkers = [];
            var upWarningMarkers = [];
            var warning = " <div>";
            warning += "     <div style=\"position:relative;padding-left:40px;padding-right:64px;overflow: hidden;min-height: 30px;line-height: 30px;white-space: nowrap;text-overflow: ellipsis;\">";
            warning += "         <i class=\"fa fa-warning\" style=\"color: #ff0;font-size: 20px;position: absolute;top: 4px;left: 10px;\"></i><div id='warningColor' style=\"position:absolute;top:0;right:10px;background-color:#e3e3e3;width:70px;height:30px;line-height:30px;text-align:center;border-radius:2px\">";
            warning += "             <span style=\"font-size:17px\">详情<\/span><span style=\"position:relative;bottom:-2px;display:inline-block;border:solid 5px;border-bottom-color:transparent;border-left-color:transparent;border-right-color:transparent;line-height:30px;margin-top:10px;margin-left:6px\"><\/span>";
            warning += "             <div>";
            warning += "             <\/div>";
            warning += "         <\/div>";
            warning += "     <\/div>";
            warning += " <\/div>";
            var warningFlag = 0;
            for (var j = 0; j < colors.length; j++) {
                //toBuy mark_amount marker_color mark_name warn_color
                var marker_color = colors[j];
                var mark_amount = current[j] / rice[j] * 100 + '%';
                if(markerName[j].indexOf(" ") > -1 && markerName[j].length >= 8){
                    var mark_name = markerName[j].split(" ")[markerName.length - 1]
                }else{
                    var mark_name = markerName[j];
                }
                if (current[j] < warn[j]) {
                    warningFlag++;
                    var warn_color = "rgb(226,64,0)";
                    warningMarkers.push(mark_name);
                    upWarningMarkers.push("<a style=\"text-decoration:underline;margin-right:10px\">" + mark_name + "<\/a>");
                } else {
                    var warn_color = "rgb(202,202,202)";
                }
                var toBuy = "http://s.m.taobao.com/h5?q=";
                toBuy += printerArr[i].printer_model.split(" ").join("+") + "+" + mark_name;
                toBuy += "&search=%E6%8F%90%E4%BA%A4";
                var spanHeigh = maxPX - (current[j] * thisPX) + "px";
                //判断是否是多彩的打印墨盒
                if(marker_color.length === 7){
                    var upDetail = '<div style="height:50px;display:inline-block;width:12px;background-color:{{marker_color}};position:relative;float:left;margin-right:4px"><span style="position:absolute;opacity:0.7;width:20px;height:{{spanHeigh}};top:0;background-color:#fff"></span></div>';
                    var colorDetail = '<li style="display:block;height:50px;background-color:rgb(246,246,246);position:relative;margin-bottom:10px"><a style="display:block" target="_blank" href={{toBuy}}><span style="height:50px;width:{{mark_amount}};display:inline-block;background-color:{{marker_color}}"></span><span style="font-size:20px;position:absolute;line-height:50px;right:15px;color:{{warn_color}}">{{mark_name}}</span></a></li>';
                    //var toBuy  = printerArr[i].printer_model;
                    upDetail = upDetail
                        .replace(new RegExp(/{{marker_color}}/g), marker_color)
                        .replace(new RegExp(/{{spanHeigh}}/g), spanHeigh);
                    colorDetail = colorDetail
                        .replace(new RegExp(/{{marker_color}}/g), marker_color)
                        .replace(new RegExp(/{{mark_amount}}/g), mark_amount)
                        .replace(new RegExp(/{{warn_color}}/g), warn_color)
                        .replace(new RegExp(/{{mark_name}}/g), mark_name)
                        .replace(new RegExp(/{{toBuy}}/g), toBuy);
                    markers.push(colorDetail);
                    upmarkers.push(upDetail);
                }else{
                    var allMarker = marker_color.split("#");
                    for (var w = 0; w < allMarker.length; w++) {
                        var upDetail = '<div style="height:50px;display:inline-block;width:12px;background-color:{{marker_color}};position:relative;float:left;margin-right:4px"><span style="position:absolute;opacity:0.7;width:20px;height:{{spanHeigh}};top:0;background-color:#fff"></span></div>';
                        var colorDetail = '<li style="display:block;overflow:hidden; height:50px;background-color:rgb(246,246,246);position:relative;margin-bottom:10px"><a style="display:block" target="_blank" href={{toBuy}}><span style="height:50px;width:{{mark_amount}};display:inline-block;background-color:{{marker_color}}"></span><span style="font-size:20px;position:absolute;line-height:50px;right:15px;color:{{warn_color}}">{{mark_name}}</span></a></li>';
                        if(allMarker[w].length < 1) continue;
                        upDetail = upDetail
                            .replace(new RegExp(/{{marker_color}}/g), "#"+allMarker[w])
                            .replace(new RegExp(/{{spanHeigh}}/g), spanHeigh);
                        colorDetail = colorDetail
                            .replace(new RegExp(/{{marker_color}}/g), "#"+allMarker[w])
                            .replace(new RegExp(/{{mark_amount}}/g), mark_amount)
                            .replace(new RegExp(/{{warn_color}}/g), warn_color)
                            .replace(new RegExp(/{{mark_name}}/g), mark_name)
                            .replace(new RegExp(/{{toBuy}}/g), toBuy);
                        markers.push(colorDetail);
                        upmarkers.push(upDetail);
                    };
                }


            };


            var strVar = strVar.replace(new RegExp(/{{imgSrc}}/g), printerArr[i].printer_mainImg).replace(new RegExp(/{{printer_modal}}/g), printerArr[i].printer_model);
            var container = $(strVar);
            if(warningFlag > 0 ){
                    container.find(".list-item").after(warning);
                    container.find("#warningColor").before(upWarningMarkers.join(''));
                }
            container.find("#detail").append(markers.join(''));
            container.find("#markerCon").append(upmarkers.join(''));
            return setTimeout(function() {
                $("#J_SearchList").find("li").eq(0).before(container);
                var h = container.height();
                // console.log("h", h);
                container.css('height', 0);
                setTimeout(function() {
                    container.css("display", "block");
                    setTimeout(function() {
                        container.css({
                            height: h,
                            opacity: 1
                        });
                    }, 50);
                }, 1300);
            }, 100);
        })();

    }

}

function ONLOAD() {

    if (window.Loaded !== undefined || window.Loaded === true) {
        action();
    } else {
        window.onload = function() {
            action();
        }
    }
}

var keyWordMap = {
    printer: function(kObj) {
        findDevice(kObj.key)
            .then(function(tmpArr) {
                //得到需要的打印机数据对象
                var printerArr = getPrinterAttr(tmpArr);
                console.log("printerArr", printerArr);

                getMobTemp(printerArr);
                //加载模板之前先初始化一次,百度可能把之前加载的样式清空
                //init();

            });
    }
};

function action() {

    setTimeout(function() {
        include_js("//a.wi.fi/shared/js/jquery.js");

        setTimeout(function() {
            //遍历keyMap
            //拿到keyword的方式有两种
            //一..
            //1得到request对象
            var reqObj = getRequest(decodeURI(location.search));
            //2.得到用户搜索的关键字对象
            var kObj = getKEYOBJ(reqObj);

            searchKeyWordMap(kObj);
        }, 1300);

    }, 1300)



    //二 在PC端要特别监听#form表单的提交
    // if (isPC) {
    //     document.getElementById("form").addEventListener("submit", function () {
    //         var kObj = getKEYOBJ();
    //         console.log("kObj", kObj);
    //         searchKeyWordMap(kObj);

    //     })
    // }

}
ONLOAD();
