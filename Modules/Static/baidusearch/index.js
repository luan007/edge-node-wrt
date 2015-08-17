(function () {
    console.log('进入脚本');
    var svgPic = {
        "pc": function () {
            var strVar = "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"255.12px\" height=\"155.91px\" viewbox=\"0 0 255.12 155.91\" enable-background=\"new 0 0 255.12 155.91\" xml:space=\"preserve\"><g><path d=\"M174.75,109.457H80.916c-2.481,0-4.5-2.019-4.5-4.5V36.924c0-2.481,2.019-4.5,4.5-4.5h93.834c2.481,0,4.5,2.019,4.5,4.5 v68.033C179.25,107.438,177.231,109.457,174.75,109.457z M80.916,35.424c-0.827,0-1.5,0.673-1.5,1.5v68.033 c0,0.827,0.673,1.5,1.5,1.5h93.834c0.827,0,1.5-0.673,1.5-1.5V36.924c0-0.827-0.673-1.5-1.5-1.5H80.916z\"><\/path><path d=\"M159.2,123.657H96.467v-8.646H159.2V123.657z M99.467,120.657H156.2v-2.646H99.467V120.657z\"><\/path><g><rect x=\"119.767\" y=\"107.957\" width=\"3\" height=\"8.554\"><\/rect><rect x=\"133.233\" y=\"107.957\" width=\"3\" height=\"8.554\"><\/rect><\/g><\/g><\/svg>";
            return strVar;
        },
        "mobile": function () {
            var strVar = "";
            strVar += "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"255.12px\" height=\"155.91px\" viewBox=\"0 0 255.12 155.91\" enable-background=\"new 0 0 255.12 155.91\" xml:space=\"preserve\"><path d=\"M151.846,107.338h-48.135V40.549h48.135V107.338z M106.711,104.338h42.135V43.549h-42.135V104.338z\"><\/path><path d=\"M155.666,129.499H99.891c-2.481,0-4.5-2.019-4.5-4.5V31.083c0-2.481,2.019-4.5,4.5-4.5h55.775c2.481,0,4.5,2.019,4.5,4.5";
            strVar += " v93.917C160.166,127.48,158.147,129.499,155.666,129.499z M99.891,29.583c-0.827,0-1.5,0.673-1.5,1.5v93.917";
            strVar += " c0,0.827,0.673,1.5,1.5,1.5h55.775c0.827,0,1.5-0.673,1.5-1.5V31.083c0-0.827-0.673-1.5-1.5-1.5H99.891z\"><\/path><path d=\"M135.119,36.566h-14.682c-0.828,0-1.5-0.671-1.5-1.5s0.672-1.5,1.5-1.5h14.682c0.828,0,1.5,0.671,1.5,1.5";
            strVar += " S135.947,36.566,135.119,36.566z\"><\/path><path d=\"M127.778,121.639c-2.653,0-4.812-2.158-4.812-4.812s2.159-4.812,4.812-4.812s4.812,2.158,4.812,4.812";
            strVar += " S130.432,121.639,127.778,121.639z M127.778,115.014c-0.999,0-1.812,0.812-1.812,1.812s0.813,1.812,1.812,1.812";
            strVar += " s1.812-0.812,1.812-1.812S128.777,115.014,127.778,115.014z\"><\/path><\/svg>";
            return strVar;
        },
        "printer": function () {
            var strVar = "";
            strVar += "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"255.12px\" height=\"155.91px\" viewBox=\"0 0 255.12 155.91\" enable-background=\"new 0 0 255.12 155.91\" xml:space=\"preserve\"><g><path d=\"M101.791,69.854H91.543v-9.5h10.248V69.854z M94.543,66.854h4.248v-3.5h-4.248V66.854z\"><\/path><path d=\"M164.167,69.854h-10.249v-9.5h10.249V69.854z M156.918,66.854h4.249v-3.5h-4.249V66.854z\"><\/path><path d=\"M156.834,113.801H98.875V60.363h57.959V113.801z M101.875,110.801h51.959V63.363h-51.959V110.801z\"><\/path><path d=\"M179.105,98.184h-3V45.078c0-0.827-0.673-1.5-1.5-1.5H81.104c-0.827,0-1.5,0.673-1.5,1.5v53.021h-3V45.078";
            strVar += "     c0-2.481,2.019-4.5,4.5-4.5h93.502c2.481,0,4.5,2.019,4.5,4.5V98.184z\"><\/path><path fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-miterlimit=\"10\" d=\"M112.474,114\"><\/path><rect x=\"76.594\" y=\"95.5\" width=\"22.406\" height=\"3\"><\/rect><rect x=\"156.76\" y=\"95.5\" width=\"22.334\" height=\"3\"><\/rect><rect x=\"108.25\" y=\"66.708\" width=\"39\" height=\"3\"><\/rect><rect x=\"108.25\" y=\"73.541\" width=\"39\" height=\"3\"><\/rect><rect x=\"108.25\" y=\"79.979\" width=\"39\" height=\"3\"><\/rect><rect x=\"108.25\" y=\"86.479\" width=\"24.333\" height=\"3\"><\/rect><rect x=\"108.25\" y=\"95.479\" width=\"12.5\" height=\"3\"><\/rect><\/g><\/svg>";

            return strVar;
        },
        "laptop": function () {
            var strVar = "";
            strVar += "<svg version=\"1.1\" id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" x=\"0px\" y=\"0px\" width=\"255.12px\" height=\"155.91px\" viewBox=\"0 0 255.12 155.91\" enable-background=\"new 0 0 255.12 155.91\" xml:space=\"preserve\"><g><path d=\"M171.744,103.184h-3V46.412c0-0.827-0.673-1.5-1.5-1.5H89.41c-0.827,0-1.5,0.673-1.5,1.5v56.682h-3V46.412";
            strVar += "     c0-2.481,2.019-4.5,4.5-4.5h77.834c2.481,0,4.5,2.019,4.5,4.5V103.184z\"><\/path><path fill=\"none\" stroke=\"#000000\" stroke-width=\"3\" stroke-miterlimit=\"10\" d=\"M78.412,105\"><\/path><g><path d=\"M82.748,113.688c-1.197,0-2.325-0.469-3.176-1.318c-0.853-0.852-1.321-1.98-1.321-3.18v-3.414h3v3.414";
            strVar += "         c0,0.396,0.157,0.772,0.441,1.057c0.284,0.285,0.659,0.441,1.056,0.441c0,0,0.001,0,0.002,0l90.991-0.079";
            strVar += "         c0.827-0.001,1.501-0.675,1.501-1.503v-3.403h3v3.403c0,2.48-2.019,4.5-4.499,4.503l-90.991,0.079";
            strVar += "         C82.751,113.688,82.749,113.688,82.748,113.688z\"><\/path><rect x=\"78.244\" y=\"103.084\" width=\"99.999\" height=\"3\"><\/rect><\/g><\/g><\/svg>";


            return strVar;
        }
    };

    function isEmptyObject(o) {
        for (var n in o) {
            return false;
        }
        return true;
    }

    window.crap = {
        getRequest: function (thisHref) {
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
        },
        findDevice: function (KeyWord) {
            var promise = new Promise(function (resolve, reject) {
                $.post("//API.wi.fi/device/all")
                    .done(function (res) {
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
        },
        include_css: function (css_file) {
            $.get(css_file)
                .done(function (css) {
                    var html_doc = document.getElementsByTagName('head')[0];
                    var styleTag = document.createElement("style");
                    styleTag.type = 'text/css';
                    if (styleTag.styleSheet) {
                        styleTag.styleSheet.cssText = css;
                    } else {
                        styleTag.appendChild(document.createTextNode(css));
                    }
                    html_doc.appendChild(styleTag);
                })
        },
        include_js: function (path) {
            var sobj = document.createElement('script');
            sobj.type = "text/javascript";
            sobj.src = path;
            var headobj = document.getElementsByTagName('head')[0];
            headobj.appendChild(sobj);
        },
        getPrinterAttr: function (originPrinterArr) {
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

                //打印机墨盒的颜色
                Printer["marker_colors"] = printerIpp["marker-colors"];
                //打印机状态 "0表示离线"
                Printer["state"] = originPrinterArr[i].state;
                //打印机ID
                Printer["printer_ID"] = originPrinterArr[i].id;
                //得到打印机型号
                Printer["printer_model"] = originPrinterArr[i].attributes.model.value;
                //得到打印机名称
                Printer["printer_name"] = printerIpp["printer-name"];
                //得到总墨量
                Printer["printer_rice"] = printerIpp["marker-high-levels"];
                //现在的墨量
                Printer["printer_current"] = printerIpp["marker-levels"];
                //告警墨量
                Printer["printer_warn"] = printerIpp["marker-low-levels"];
                PrinterArr.push(Printer);
            }
            return PrinterArr;
        },
        getDeviceAttr: function (originDeviceArr) {
            var DeviceArr = [];
            for (var i = 0, length1 = originDeviceArr.length; i < length1; i++) {
                var Device = {};
                Device["time"] = originDeviceArr[i].time;
                var DeviceAttr = originDeviceArr[i].attributes;
                for (var thisClass in originDeviceArr[i].classes) {
                    Device["classes"] = thisClass;
                    break;
                }
                //打印机状态 "0表示离线"
                Device["state"] = originDeviceArr[i].state;
                //打印机ID
                Device["Device_ID"] = originDeviceArr[i].id;
                //得到打印机型号
                if (DeviceAttr.model) {
                    Device["Device_model"] = DeviceAttr.model.value;
                }
                if (DeviceAttr.name) {
                    //得到打印机名称
                    Device["Device_name"] = DeviceAttr.name.value;
                }
                DeviceArr.push(Device);
            }
            return DeviceArr;
        }
    };
    var getFD = function () {
        var promise = new Promise(function (resolve, reject) {
            $.post("//api.wi.fi/io/createwebfd")
                .fail(function (err) {
                    console.log('请求key失败');
                    reject(err);
                })
                .done(function (res) {
                    resolve(res.result);

                });
        });
        return promise;
    }

    function getMobTemp(printerArr) {

        var max = printerArr[0].printer_rice[0];
        var maxPX = 25;
        var thisPX = maxPX / max;
        for (var i = 0, length1 = printerArr.length; i < length1; i++) {
            if (printerArr[i].state === 0) continue;
            (function () {
                var res = "";
                res += "<div style=\"opacity:0;transition: all 0.5s ease-in-out;text-align:left;border:1px solid #ececec;border-radius:0;overflow:hidden;background:#eee\" id=\"M_container\">";
                res += "	<div class=\"_M_item\" style=\"background-color:#fff;border:solid 1px #e1e1e1;border-radius:2px; margin:5px; \">";
                res += "		<input id=\"printer_ID\" type=\"text\" style=\"display:none\" value=\"\" data-printer=\"\"><input id=\"printer_driver\" type=\"text\" style=\"display:none\" value=\"\" data-printer=\"\">";
                res += "		<div style=\"border-bottom:1px solid #efefef;padding-bottom:5px;margin-top:5px\">";
                res += "			<span style=\"font-size:1.2em;opacity:1;font-weight:lighter;padding:5px;color:#777\">edge附近的<i style=\"color:#C00\">打印机<\/i><\/span>";
                res += "		<\/div>";
                res += "		<div class=\"printer_list\">";
                res += "			<div class=\"printer_dragzone\" style=\"position:relative\">";
                res += "				<div style=\"width:100%;table-layout:fixed;margin-top:10px;border-bottom:1px solid #eee;display:table\">";
                res += "					<div style=\"display:table-cell;vertical-align:middle;padding:10px 15px;width:50px;text-align:center\">";
                res += "						<img id=\"printer_mainImg\" src=\"http://192.168.66.16/ipp/images/printer.png\" alt=\"\" style=\"width:100%\">";
                res += "					<\/div>";
                res += "					<div style=\"display:table-cell;width:150px;padding:10px 15px;overflow:hidden\">";
                res += "						<h3 id=\"printer_model\" style=\"font-size:1.5em;text-overflow:ellipsis;display:block;white-space:nowrap;overflow:hidden;margin:0;color:#444;font-weight:400;margin-bottom:0\"><\/h3>";
                res += "						<div style=\"margin-top:5px;margin-bottom:10px\">";
                res += "							<span id=\"printer_name\" style=\"font-size:15px;color:#aaa;vertical-align:middle;\"><\/span>";
                res += "						<\/div>";
                res += "						<div style=\"width:100%\">";
                res += "							<div id=\"color_box\" style=\"width:21%;display:table-cell;letter-spacing:0;font-size:0;padding:2px;border:1px solid #E2E2E2\">";
                res += "							<\/div>";
                res += "							<div style=\"width:130px;display:table-cell;line-height:25px;vertical-align:middle;padding-left:20px;font-size:1em\">";
                res += "								<div style=\"position:relative;border-radius:5px;border:1px solid #ddd;padding:3px;width:100%;text-align:center;background:#F7F7F7;cursor:pointer\">";
                res += "									<form class=\"upload\" id=\"form_1\" action=\"/upload\" method=\"post\">";
                res += "										<div class=\"printer_btn\">";
                res += "											<span class=\"printer_action\">打印<\/span>";
                res += "										<\/div>";
                res += "										<input class=\"upload_file\" type=\"file\" name=\"fileName\" id=\"fileName\" style=\"position:absolute;top:0;width:100%;left:0;height:30px;opacity:0;display:block;z-index:1000\"><input type=\"submit\" value=\"tijiao\" style=\"display:none\">";
                res += "									<\/form>";
                res += "								<\/div>";
                res += "							<\/div>";
                res += "						<\/div>";
                res += "					<\/div>";
                res += "				<\/div>";
                res += "				<div style=\"position:absolute;left:0;right:0;top:0;bottom:0;background:rgba(0,0,0,.8);border-radius:3px;color:#fff;vertical-align:middle;text-align:center;display:none\" id=\"loading\">";
                res += "					<h1 style=\"font-weight:lighter;font-size:25px;margin-top:26px;margin-bottom:0\"><i class=\"fa fa-2x fa-spinner fa-spin\" style=\"\"><\/i><\/h1>";
                res += "				<\/div>";
                res += "			<\/div>";
                res += "		<\/div>";
                res += "		<div>";
                res += "			<span style=\"font-size:.7em;opacity:.4;font-weight:lighter;display:block;line-height:21px;margin-left:10px\">powered by <b>Edge<\/b><\/span>";
                res += "		<\/div>";
                res += "	<\/div>";
                res += "<\/div>";

                console.log("printerArr[i].state", printerArr[i].state);

                var container = $(res);
                $("#results").before(container);
                setTimeout(function () {
                    //   var h = container.height();
                    //  console.log("h",h);
                    container.css("opacity", 1);
                }, 300);

                var _M_item = container.find("._M_item");
                for (var _i = 0; _i < printerArr[i].marker_colors.length; ++_i) {
                    container.find("#color_box").append(getColor(printerArr[i].marker_colors[_i]));
                }
                for (var _i = 0; _i < printerArr[i].printer_current.length; ++_i) {
                    _M_item.find(".M_current").eq(_i).find("div").css("height", maxPX - printerArr[i].printer_current[_i] * thisPX);
                }
                console.log('printerArr[i]', printerArr[i]);
                console.log('_M_item.find("#printer_ID")', _M_item.find("#printer_ID"));
                _M_item.find("#printer_ID").attr("data-printer", printerArr[i].printer_ID);
                // TODO 只添加了一个驱动
                _M_item.find("#printer_driver").attr("data-printer", printerArr[i].printer_driver[0]);
                _M_item.find("#printer_mainImg").attr('src', printerArr[i].printer_mainImg);
                _M_item.find("#printer_model").html(printerArr[i].printer_model);
                _M_item.find("#printer_name").html(printerArr[i].printer_name);
                return container.find("#fileName").on("change", function () {

                    container.find("#loading").css("display", "block");
                    getFD().then(function (res) {
                        getInvokeData(res, container);
                        var files = container.find("#fileName")[0].files[0];
                        console.log("手机文件", files);
                        var xhr = upLoadFile(files);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                console.log("上传成功");
                                container.find("#loading").css("display", "none");
                            } else {
                                alert("上传失败");
                                console.log("上传失败");
                            }
                        }
                        postInvoke();
                    });
                });
            })();

        }

    }

    function getInvokeData(res, container) {

        printerKey = res;
        console.log("getInvokeData", container);
        printer_ID = container.find("#printer_ID").attr('data-printer');
        printer_driver = container.find("#printer_driver").attr("data-printer");
        console.log('printerKey', printerKey);
        action = "//api.wi.fi/fd/" + printerKey;


    };

    function upLoadFile(files) {
        console.log(files);
        var xhr = new XMLHttpRequest();
        var formData = new FormData();
        formData.append("I'm file", files);
        xhr.open("POST", action);

        xhr.send(formData);

        return xhr;
    };

    function postInvoke() {
        setTimeout(function () {
            $.post("//api.wi.fi/driver/invoke", {
                '1': "App_Launcher:IPP",
                '2': printer_ID,
                '3': 'print',
                '4': JSON.stringify({
                    fd: printerKey,
                    job_name: '我是一个打印任务'
                })
            }).done(function (res) {
                console.log('invoke return', res);
            });
        }, 3300);
    }

    function getPCTemp(printerArr) {
        var max = printerArr[0].printer_rice[0];
        var maxPX = 25;
        var thisPX = maxPX / max;
        for (var i = 0, length1 = printerArr.length; i < length1; i++) {
            if (printerArr[i].state === 0) continue;
            (function () {
                var res = "";
                res += "<div style=\"height:auto; /* visibility:hidden; */ display: none;transition: all 1s ease-in-out;-webkit-transition: all 1s ease-in-out;border:1px solid #ECECEC;border-radius:0;margin-bottom:15px;box-shadow:1px 2px 1px rgba(0,0,0,.072);padding:5px;background:#fff;overflow:hidden;font-family: sans-serif;\" id=\"M_container\">";
                res += " <div style=\"border-bottom:1px solid #efefef;padding-bottom:5px\">";
                res += "     <span style=\"font-size:1.2em;opacity:1;font-weight:lighter;padding:5px;color:#777\">edge 附近的 <i style=\"color:#C00;\">打印机<\/i><\/span>";
                res += " <\/div>";
                res += " <div class=\"printer_list\">";
                res += "     <div class=\"printer_dragzone _M_item\" style=\"position:relative\">";
                res += "         <input id=\"printer_ID\" type=\"text\" style=\"display:none\" value=\"\" data-printer=\"4fdcaac0e45c4d5982664272b6b267f2\"><input id=\"printer_driver\" type=\"text\" style=\"display:none\" value=\"\" data-printer=\"App_Launcher:IPP\">";
                res += "         <div style=\"width:100%;table-layout:fixed;/* margin-top:10px; */margin: 10px 0;/* border-bottom:1px solid #eee; */display:table\">";
                res += "             <div style=\"display:table-cell;vertical-align:middle;padding: 10px 15px;width: 30px;text-align:center\">";
                res += "                 <img src=\"http://192.168.66.16/ipp/images/printer.png\" style=\"max-width: 100%;height: 100px;\" id=\"printer_mainImg\">";
                res += "             <\/div>";
                res += "             <div style=\"display:table-cell;width:150px;padding:10px 15px;overflow:hidden\">";
                res += "                 <h3 style=\"font-size:1.5em;text-overflow:ellipsis;display:block;white-space:nowrap;overflow:hidden;margin:0;color:#444;font-weight:400;margin-bottom:0\" id=\"printer_model\">LaserJet 200 colorMFP M276nw<\/h3>";
                res += "                 <div style=\"margin: 10px 0;/* margin-top:5px; *//* margin-bottom:10px */\">";
                res += "                     <img src=\"http://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/480px-HP_logo_2012.svg.png\" style=\"height:20px;vertical-align:middle;display:none\"><span style=\"font-size:15px;color:#aaa;vertical-align:middle;\" id=\"printer_name\">NPIFEF707<\/span>";
                res += "                 <\/div>";
                res += "                 <div>";
                res += "                     <div id=\"color_box\" style=\"display:table-cell;letter-spacing:0;font-size:0;padding:2px;border:1px solid #E2E2E2\">";
                res += "                     <\/div>";
                res += "                     <div style=\"width:130px;display:table-cell;line-height:25px;vertical-align:middle;padding-left:20px;font-size:1em\">";
                res += "                         <div style=\"position:relative;border-radius:5px;border:1px solid #ddd;padding:3px;width:100%;text-align:center;background:#F7F7F7;cursor:pointer\">";
                res += "                             <form class=\"upload\" id=\"form_1\" action=\"/upload\" method=\"post\">";
                res += "                                 <div class=\"printer_btn\">";
                res += "                                     <span class=\"printer_action\">打印<\/span>";
                res += "                                 <\/div>";
                res += "                                 <input class=\"upload_file\" type=\"file\" name=\"fileName\" id=\"fileName\" style=\"position:absolute;top:0;width:100%;left:0;height:30px;opacity:0;display:block;cursor:pointer;z-index:1000\"><input type=\"submit\" value=\"tijiao\" style=\"display:none\">";
                res += "                             <\/form>";
                res += "                         <\/div>";
                res += "                     <\/div>";
                res += "                 <\/div>";
                res += "             <\/div>";
                res += "         <\/div>";
                res += "         <div style=\"position:absolute;left:0;right:0;top:0;bottom:0;background:rgba(0,0,0,.8);border-radius:3px;color:#fff;vertical-align:middle;text-align:center;display:none\" id=\"loading\">";
                res += "             <h1 style=\"font-weight:lighter;font-size:25px;margin-top:26px;margin-bottom:0\"><i class=\"fa fa-2x fa-spinner fa-spin\" style=\"\"><\/i><\/h1>";
                res += "         <\/div>";
                res += "     <\/div>";
                res += " <\/div>";
                res += " <div style=\" border-top: solid 1px #efefef; \">";
                res += "     <span style=\"font-size:.7em;opacity:.4;font-weight:lighter\">powered by <b>Edge<\/b><\/span>";
                res += " <\/div>";
                res += "<\/div>";

                var container = $(res);
                var _M_item = container.find("._M_item");
                for (var _i = 0; _i < printerArr[i].marker_colors.length; ++_i) {
                    container.find("#color_box").append(getColor(printerArr[i].marker_colors[_i]));
                }
                for (var _i = 0; _i < printerArr[i].printer_current.length; ++_i) {
                    _M_item.find(".M_current").eq(_i).find("div").css("height", maxPX - printerArr[i].printer_current[_i] * thisPX);
                }
                // console.log('printerArr[i]', printerArr[i]);
                // console.log('_M_item.find("#printer_ID")', _M_item.find("#printer_ID"));
                _M_item.find("#printer_ID").attr("data-printer", printerArr[i].printer_ID);
                // TODO 只添加了一个驱动
                _M_item.find("#printer_driver").attr("data-printer", printerArr[i].printer_driver[0]);
                _M_item.find("#printer_mainImg").attr('src', printerArr[i].printer_mainImg);
                _M_item.find("#printer_model").html(printerArr[i].printer_model);
                _M_item.find("#printer_name").html(printerArr[i].printer_name);

                var loading = container.find(".printer_dragzone")[0];
                console.log("container", container);
                loading.ondragover = function () {
                    container.find("#loading").css('display', 'block');
                    return false;
                };
                loading.ondragend = function () {
                    console.log('ondragend');
                    return false;
                };
                loading.ondrop = function (event) {
                    event.preventDefault();
                    var files = event.dataTransfer.files[0];
                    getFD().then(function (res) {
                        getInvokeData(res, container);
                        console.log(files);
                        var xhr = upLoadFile(files);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                console.log("上传成功");
                                $("#loading").css("display", "none");
                            } else {
                                alert("上传失败");
                                console.log("上传失败");
                            }
                        }
                        postInvoke();
                    });
                };

                container.find("#fileName").on("change", function () {
                    console.log("$(this)", $(this));
                    var self = $(this).parents("#M_container");
                    self.find("#loading").css("display", "block");
                    getFD().then(function (res) {
                        getInvokeData(res, container);
                        var files = self.find("#fileName")[0].files[0];
                        var xhr = upLoadFile(files);
                        xhr.onload = function () {
                            if (xhr.status === 200) {
                                console.log("上传成功");
                                self.find("#loading").css("display", "none");
                            } else {
                                alert("上传失败");
                                console.log("上传失败");
                            }
                        }
                        postInvoke();
                    }.bind(this));
                });

                return setTimeout(function () {
                    $("#content_left").find(":first").before(container);
                    var h = container.height();
                    // console.log("h", h);
                    container.css('height', 0);
                    setTimeout(function () {
                        container.css("display", "block");
                        setTimeout(function () {
                            container.css('height', h);
                        }, 50);
                    }, 1300);
                }, 100);

            })();

        }


    }

    var keyWordMap = {
        printer: function (kObj) {
            //打印机分移动端和PC端
            /**
             * @params 关键字
             * @return 所有的数据对象 数组
             */
            crap.findDevice(kObj.key)
                .then(function (tmpArr) {
                    //得到需要的打印机数据对象
                    var printerArr = crap.getPrinterAttr(tmpArr);
                    console.log("printerArr", printerArr);
                    //加载模板之前先初始化一次,百度可能把之前加载的样式清空
                    init();
                    kObj.isPC ? getPCTemp(printerArr) : getMobTemp(printerArr);
                });
        },
        device: function (kObj) {
            var mobileTempContaienr = "<div class=\"device_container\" style=\"border:1px solid #e8e8e8;border-radius:2px;font-family:&quot;微软雅黑&quot\"><div class=\"title_box\" style=\"line-height:50px;border-bottom:1px solid #e3e3e3\"><p style=\"font-size:19px;color:#00C\">StudioEmerge附近的 <em>设备<\/em><\/p><\/div><div style=\"margin:10px 0;color:#aaa\"><div class=\"total\"><p class=\"device_total\"><\/p><\/div><div class=\"box_container\"><\/div><div class=\"footer\"><div style=\"transition:none\" tabindex=\"-1\" class=\"button\">查看所有设备<\/div><\/div><\/div><div class=\"foot_info\">Powered by edge<\/div><\/div>";
            var mobileTempbox = "<div class=\"box\"><div><div class=\"svg_box\"><\/div><p class=\"device_name\"><\/p><p class=\"info\"><span class=\"light\"><span><\/span><\/span><span class=\"deviceTime\"><\/span><\/p><\/div><\/div>";
            console.log("kObj", kObj);
            crap.findDevice(kObj.key).then(function (res) {
                console.log(res);

                var Device = crap.getDeviceAttr(res);
                if (isPC) {


                } else {
                    crap.include_css("//a.wi.fi/baidusearch/allDevice/AllDevice.css");
                    var str = "<div class=\"device_container\" style=\"  text-align:left;border:1px solid #e8e8e8;background: #fff;border-radius:2px;font-family:&quot;微软雅黑&quot\"><div class=\"title_box\" style=\"line-height:50px;border-bottom:1px solid #e3e3e3\"><p style=\"font-size:19px;color:#00C\">StudioEmerge附近的 <em>设备<\/em><\/p><\/div><div style=\"margin:10px 0;color:#aaa\"><div class=\"total\"><p class=\"device_total\">共有" + Device.length + "台设备在线<\/p><\/div><div class=\"box_container\">";

                    for (var i = 0; i < Device.length; i++) {
                        //  timeExchange
                        if (!svgPic[Device[i].classes]) continue;
                        console.log(Device[i].time);

                        var timeStr = Device[i].time.replace(/T/, " ").split('.');
                        var deviceMillTime = timeExchange(timeStr[0]);
                        var thisTime = new Date().getTime() - deviceMillTime;
                        var minutes = thisTime / 1000 / 60;
                        minutes = Math.ceil(minutes);
                        if (minutes > 60) {
                            var hour = minutes / 60;
                            hour = hour.toString().split('.');

                            minutes = hour[1].substr(0, 1) / 10 * 60;
                            minutes = hour[0] + "小时" + minutes

                        }

                        str += "<div class=\"box\"><div><div class=\"svg_box\">" + svgPic[Device[i].classes]() + "<\/div><p class=\"device_name\">" + Device[i].Device_name + "<\/p><p class=\"info\"><span class=\"light\"><span><\/span><\/span><span class=\"deviceTime\">" + minutes + "分钟前<\/span><\/p><\/div><\/div>"

                    }

                    str += "<\/div><div class=\"footer\"><div style=\"transition:none\" tabindex=\"-1\" class=\"button\">查看所有设备<\/div><\/div><\/div><div class=\"foot_info\">Powered by edge<\/div><\/div>";


                    $("#results").before(str);

                }


            });
        }
    };
    var KEYREG = {
        printer: /打印/i,
        device: /设备/i,
        light: /灯/i,
        pc: /电脑/i,
        mobile: /手机/i
    }
    var getKEYOBJ = function (reqObj) {
        var KEYOBJ = {};
        if (reqObj) {
            if (isPC) {
                KEYOBJ["kw"] = reqObj.wd;
                KEYOBJ["isPC"] = true;
            } else {
                KEYOBJ["kw"] = reqObj.word;
                KEYOBJ["isPC"] = false;
            }
        } else {
            KEYOBJ["kw"] = $("#kw").val();
            KEYOBJ["isPC"] = true;
        }
        return KEYOBJ;
    }

    function action() {
        //遍历keyMap
        //拿到keyword的方式有两种
        //一..
        //1得到request对象
        var reqObj = crap.getRequest(decodeURI(location.search));
        //2.得到用户搜索的关键字对象
        var kObj = getKEYOBJ(reqObj);

        searchKeyWordMap(kObj);
        //二 在PC端要特别监听#form表单的提交
        if (isPC) {
            document.getElementById("form").addEventListener("submit", function () {
                var kObj = getKEYOBJ();
                console.log("kObj", kObj);
                searchKeyWordMap(kObj);

            })
        }

    }

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

    var getFileSize = function (size) {
        var cutoff, i, selectedSize, selectedUnit, unit, units, _i, _len;
        units = ['TB', 'GB', 'MB', 'KB', 'b'];
        selectedSize = selectedUnit = null;
        for (i = _i = 0, _len = units.length; _i < _len; i = ++_i) {
            unit = units[i];
            cutoff = Math.pow(1000, 4 - i) / 10;
            if (size >= cutoff) {
                selectedSize = size / Math.pow(1000, 4 - i);
                selectedUnit = unit;
                break;
            }
        }
        selectedSize = Math.round(10 * selectedSize) / 10;
        return "<strong>" + selectedSize + "</strong> " + selectedUnit;
    }

    function getColor(color) {
        if(color.length === 7){
            return '<div style="height:25px;width:5px;border:1px solid #FFF;overflow:hidden;background:' + color + ';display:inline-block" class="M_current"> <div style=" transition: height 1s ease-in-out;height: 0px; width: 10px; background: rgba(255, 255, 255, 0.8);"> </div> </div>';
        }
        var color = color.split("#");
        var colors = [];
        var widthFlag = 0;
        for (var ii = 0; ii < color.length; ii++) {
            if(color[ii].length < 1)  continue;
            widthFlag++;
        };

     var strVar  =  '<div style="position:relative;height:25px;width:'+widthFlag*6+'px;border:1px solid #FFF;overflow:hidden;display:inline-block" class="M_current"> <div style="position:absolute;top:0px; height: 8.25px; width: '+widthFlag*6+'px; background: rgba(255, 255, 255, 0.8);"> </div>';
        for(var z = 0, length1 = color.length; z < length1; z++){
                if(color[z].length <1 ) continue;
                strVar+='<span style="margin-right:1px; width: 5px; height: 100%; background-color: #'+color[z]+'; display: block; float: left; "></span>';
            }
        strVar +='</div>'
        return strVar;
    }

    //如果window onload事件已经过了那么直接执行逻辑代码
    function ONLOAD() {
        if (window.Loaded !== undefined || window.Loaded === true) {
            action();
        } else {
            window.onload = function () {
                action();
            }
        }
    }

    ONLOAD();


    function timeExchange(datastr) {
        var date = new Date();
        var perfex = datastr.split(" ")[0];
        var surfex = datastr.split(" ")[1]
        if (perfex) {
            var y = perfex.split("-")[0] / 1;
            //因为月是从0开始的，所以减一
            var m = perfex.split("-")[1] / 1 - 1;
            var d = perfex.split("-")[2] / 1;
            date.setFullYear(y, m, d);
        }
        if (surfex) {
            var h = surfex.split(":")[0] / 1;
            var m = surfex.split(":")[1] / 1;
            var s = surfex.split(":")[2] / 1;
            date.setHours(h, m, s, 0);
        }
        return date.getTime();
    }


})();
