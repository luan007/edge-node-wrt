window.devs = {};
window.usrs = {};
window.msgs = {};

api("device/getcurrent", [], function (e, o) {
	if (o.error) return console.log(e);
	console.log(o);
	window.CURRENTDEVICE = o.result;
	api("/message/rawquery", [{ source: "BAIDU", receiver: window.CURRENTDEVICE.id, read: false }], function (e, o) {
		if (o.error) return console.log(e);
		msgs = o ? o.result : {};
		api("device/all", [], function (e, o) {
			if (o.error) return console.log(e);
			devs = o.result;	
				api("user/all", [], function (e, o) {
			if (o.error) return console.log(e);
					usrs = o.result;
					console.log("Doing dirty work");
					dirtyWork();
			});
		});
	});
});
function getDevName(cur) {
	var name = cur.bus.hwaddr;
	if (cur.attributes) {
								if (cur.attributes.vendor) name = cur.attributes.vendor.value + " made Device [ " + cur.bus.hwaddr + " ]";
								if (cur.attributes.name) name = cur.attributes.name.value;
	} else {
								if (cur.bus.data && cur.bus.data.name) {
			name = cur.bus.data.name + " : " + cur.bus.name
								}
	}
	return name;
}

function dirtyWork(){
	if (window.hasOwnProperty("isPC") ? isPC : true) {
	
		var injection = "<span class='sucker' style='font-family: sans-serif; display:inline-block; margin-right:1px; width: auto; font-weight:lighter; color:#89ABE8'><i class='fa fa-wifi'></i></span>";
	
		var strVar = "";
		strVar += "<div class=\"map_injection\" style=\"font-family: 'Microsoft Yahei UI Light', 'Microsoft Yahei UI', sans-serif; transition: all ease 0.5s; overflow:hidden;\">"
		strVar += "  <div class=\"INJECT\"></div><div style=\"";
		strVar += "    padding: 5px 17px;";
		strVar += "    color: #2fafff;";
		strVar += "    font-size: 12px;";
		strVar += "    border-top: 1px solid #ddd;";
		strVar += "    background: #efefef;";
		strVar += "\">Connected to Edge <span style='font-size:10px; color:#aaa;' id='logger'></span><\/div>";
		strVar += "<\/div>";
	
	
		var notification = "";
		notification += "<div style=\"";
		notification += "    border-top: 1px dashed #DDDDDD;";
		notification += "    padding: 10px 17px;";
		notification += "\">";
		notification += "  <h1 style=\"";
		notification += "    font-size: 20px;";
		notification += "    font-weight: lighter;";
		notification += "    margin-bottom: 5px;";
		notification += "\"><b style=\"";
		notification += "    color: #444;";
		notification += "\">{{CONTENT}}<\/b><span style=\"";
		notification += "    font-size: 15px;";
		notification += "    color: #2fafff;";
		notification += "    margin-left: 10px;";
		notification += "\">from {{USER}}<\/span><\/h1>";
		notification += "  <h5 style=\"";
		notification += "    font-weight: lighter;";
		notification += "    font-size: 12px;";
		notification += "    color: #ccc;";
		notification += "    margin: 0;";
		notification += "\">{{TIME}}<\/h5>";
		notification += "  ";
		notification += "  <\/div>";
	
		var popup = ['<div style="font-family: \'Microsoft Yahei UI Light\', \'Microsoft Yahei UI\', sans-serif; opacity: 0; visibility: hidden;  transition: all 0.5s ease; -webkit-transition: all 0.5s ease; transform: scale(0.5); position: absolute; border-radius: 2px; min-height: 100px; min-width: 300px; border: 1px solid rgb(205, 205, 205); box-shadow: rgba(0, 0, 0, 0.498039) 1px 1px 5px; top: 142.5px; z-index: 1000000000000000; padding: 10px; left: 707.5px; background: rgb(250, 250, 250);">',
			'  <h1 style="padding-left: 40px; font-size: 16px; font-weight: lighter; opacity: 0.8; border-bottom: 1px solid #cdcdcd; padding-bottom: 10px;">发送到 <b style="color: #2fafff;font-weight: lighter;">edge</b> 网络 <br> <span id="inject_uid" style="font-size:14px; font-weight:bold; color:#666;"></span> </h1>',
			'  <i class="fa fa-map-marker" style="display: block; position: absolute; left: 17px; top: 15px; font-size: 30px; color: #D52575;"></i>',
			'  <i class="fa fa-times" id="__close"  style="top: 10px; display: block; position: absolute; right: 12px; font-size: 17px; color: #aaa;  z-index:9999999999999999999; cursor: pointer;"></i>',
			'  <div style="height: 220px;width: 505px;overflow: auto;overflow-x: hidden;" class="_usr_zone">',
			'  </div>',
			'</div>'].join("");
	
		var user = ['<div class="sl" style="padding: 5px 0px;font-family: \'Microsoft Yahei UI Light\', \'Microsoft Yahei UI\', sans-serif;">',
			'<i class="fa fa-street-view" style="border-radius: 999em; display: inline-block; text-align: center; color: #575757; font-size: 18px; padding-left: 2px; padding: 5px 4px 5px 6px; margin: 5px; vertical-align: middle;"></i>',
			'  <span style="vertical-align: middle; font-size: 16px; font-weight: lighter; font-family: helvetica,\'Microsoft Yahei UI Light\', \'Microsoft Yahei UI\', sans-serif;" > {{USERNAME}} </span>',
			'  <div class="devicelist">',
			'  </div>',
			'</div>'].join("");
	
		var device = ["<div style=\"font-family: \'Microsoft Yahei UI Light\', \'Microsoft Yahei UI\', sans-serif; display: table; table-layout: fixed; font-size: 18px; padding: 5px 0; margin-left: 50px; border-bottom: 1px solid #ddd;\">",
			"  <div style=\"display: table-cell; width: 60px; text-align: right; vertical-align: middle;\">",
			"  	<div style=\"border-radius: 9999em;height: 10px; width: 10px;background: {{STATEBG}}; display: inline-block; margin-right: 10px; border: 2px solid {{STATEBD}}; margin-top: 3px;margin-left: 0;\"></div>",
			"  </div>",
			"<div style=\"width:100%; display: table-cell; vertical-align: middle\"><span>{{DEVICENAME}}</span></div>",
			"<div style=\"display: table-cell; padding-right: 10px;\">",
			"<span class=\"GO\" deviceid=\"{{DEVICEID}}\" userid=\"{{USERID}}\" username=\"{{USERNAME}}\" style=\"padding: 5px 20px 5px 17px; display: inline-block; border-radius: 5px; color: #999; border: 1px solid #ddd; cursor: pointer; font-size: 15px;\">",
			"<i class=\"fa fa-paper-plane-o\"></i></span>",
			"</div>",
			"</div>",
		].join("");
	
	
		var _loaded = false;
		var mysucker;
		var lemask;
		var s = undefined;
		
		function addUser(userid, name, devices) {
			if (!mysucker) return;
			var t = user.replace("{{USERNAME}}", name);
			var d = $(t);
			var deviceList = $(d.find(".devicelist")[0]);
	
			for (var i in devices) {
				genDevice(userid, name, deviceList, i, devices[i]);
			}
	
			$(mysucker.find("._usr_zone")[0]).append(d);
		}
	
		function genDevice(userid, username, deviceList, key, dev) {
			var t = device.replace("{{DEVICEID}}", key)
				.replace("{{DEVICENAME}}", dev.name)
				.replace("{{USERNAME}}", username)
				.replace("{{USERID}}", userid)
				.replace("{{STATEBG}}", dev.state ? "#2ACF2A" : "#D0D0D0")
				.replace("{{STATEBD}}", dev.state ? "#4C944C" : "#BABABA");
			var d = $(t);
			var dt = $(d.find(".GO")[0]);
			dt.click(function () {
				console.log("Submit Query... plz wait..");
				var curDev = window.CURRENTDEVICE;
				api("message/sendnotification", [
					"MAP_ACT", JSON.stringify({
						uri: window.targeturl,
						addr: window.targetaddr,
						name: window.targetname
					}), getDevName(curDev), "DEVICE", [key], ["DEVICE"], "BAIDU"
				], function (e, o) {
					if (o.error) console.log(o);
					console.log("Done.");
					window.closediag();
				});
			});
			deviceList.append(d);
		}
	
		function genNotifications(obj, target) {
			if (obj.read || obj.action !== "MAP_ACT" || !obj.content) return undefined;
			var content = JSON.parse(obj.content);
			var t = $(notification.replace("{{CONTENT}}", content.name + " - " + content.addr)
				.replace("{{TIME}}", obj.sendTime)
				.replace("{{USER}}", obj.sender));
			t.click(function () {
				console.log("Touching..");
				api("message/touch", [
					[obj.uid]
				], function (e, o) {
					console.log(e, o);
	
					window.location.href = content.uri;
				});
			});
			console.log(t);
			t.appendTo(target);
		}
	
		setInterval(function () {
			if (!window.$) return;
			if (!_loaded) {
				try {
					lemask = $('<div style="opacity: 0; z-index:88888888880; visibility: hidden; transition: all ease 0.7s; position:fixed; top:0; left:0; bottom:0; right:0; background:rgba(0,0,0,0.8);"></div>');
				} catch (e) {
					return;
				}
				console.log("Loading Everything...");
				_loaded = true;
				lemask = $('<div style="opacity: 0; z-index:88888888880; visibility: hidden; transition: all ease 0.7s; position:fixed; top:0; left:0; bottom:0; right:0; background:rgba(0,0,0,0.8);"></div>');
				$('<link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">').appendTo("head");
				// 
				// 				addUser("6139847210348062", "MikeLuan", {
				// 					"345872314987913464": {name: "blah", state: 1},
				// 					"3458723149879134655": {name: "offline", state: 0}
				// 				});
				// 				
				// 				addUser("", "Others", {
				// 					"345872314987913464": {name: "blah", state: 1},
				// 					"3458723149879134655": {name: "offline", state: 0}
				// 				});
				// 				
				// 				
	
				mysucker = $(popup);
				$("#wrapper").after(mysucker);
				$("#wrapper").after(lemask);
				var t = function () {
					//CENTER MY ASS
					var h = mysucker.height();
					var w = mysucker.width();
					var clientW = window.innerWidth;
					var clientH = window.innerHeight;
					var left = (clientW - w) / 2 + "px";
					var top = (clientH - h) / 2 + "px";
					mysucker.css("top", top).css("left", left);
				};
				window.addEventListener("resize", t);
				t();
				window.closediag = function () {
					clearTimeout(s);
					lemask.css("opacity", "0");
					mysucker.css("opacity", "0");
					mysucker.css("transform", "scale(0.5)");
					s = setTimeout(function () {
						lemask.css("visibility", "hidden");
						mysucker.css("visibility", "hidden");
					}, 700);
				};
				lemask.click(closediag);
	
				var ttt = $(strVar);
				var sp = $("#searchWrapper");
				ttt.css("visibility", "hidden");
				ttt.css("opacity", "0");
				sp.append(ttt);
	
				var logger = $("#logger");
				var ij = $(ttt.find(".INJECT")[0]);
				for (var i in msgs) {
					genNotifications(msgs[i], ij);
				}
				var _h = ttt.height();
				ttt.css("height", "0px");
				setTimeout(function () {
					ttt.css("height", _h + 'px');
					ttt.css("visibility", "visible");
					ttt.css("opacity", "1");
				}, 500);
				
				logger.html(" Devices : " + Object.keys(devs).length + " | " + "Users : " + Object.keys(usrs).length);
							//sort out the list
							//				addUser("6139847210348062", "MikeLuan", {
							// 					"345872314987913464": {name: "blah", state: 1},
							// 					"3458723149879134655": {name: "offline", state: 0}
							// 				});
							// 				
							// 				addUser("", "Others", {
							// 					"345872314987913464": {name: "blah", state: 1},
							// 					"3458723149879134655": {name: "offline", state: 0}
							// 				});
							
							var mapping = {
								"": {
									name: "网络设备",
									devs: {}
								}
							};
							for (var u in usrs) {
								mapping.u = {
									name: usrs[u].name,
									devs: {}
								};
							}
							for (var d in devs) {
								var cur = devs[d];
								var parent = mapping[""];
								if (cur.owner !== "") {
									parent = mapping[cur.owner];
								}
								name = getDevName(cur);
								parent.devs[d] = {
									name: name,
									state: cur.state,
									raw: devs[d]
								};
							}
							for (var i in mapping) {
								addUser(i, mapping[i].name, mapping[i].devs);
	
							}
			}
	
			var pop = $(".BMap_bubble_pop");
			if (!pop || pop.length == 0) {
				return;
			}
			var telf = $("#JiwFav");
			if ($(".sucker") && $(".sucker").length) {
				return;
			}
			var uid = telf.attr("uid");
	
			var suck = $(injection);
			telf.before(suck);
	
			window.targeturl = "http://map.baidu.com/?newmap=1&s=inf%26uid%3D" + uid;
	
			var req = new XMLHttpRequest();
			req.open("GET", "http://map.baidu.com/?qt=inf&uid=" + uid + "&ie=utf-8&t=" + Date.now() + "&c=" + Math.floor(Math.random() * 100), true);
	
			req.onreadystatechange = function () {
				if (req.readyState == 4 && req.status == 200) {
					var val = JSON.parse(req.responseText);
					var addr = val.content.addr;
					window.targetaddr = addr;
					window.targetname = $(".iw_poi_title .title").html();
					console.log(val);
					$("#inject_uid").html($(".iw_poi_title .title").html());
					suck[0].addEventListener("click", function () {
						clearTimeout(s);
						lemask.css("visibility", "visible");
						lemask.css("opacity", "1");
						mysucker.css("opacity", "1");
						mysucker.css("visibility", "visible");
						mysucker.css("transform", "scale(1)");
					});
					$("#__close").get(0).addEventListener("click", function () {
						clearTimeout(s);
						lemask.css("opacity", "0");
						mysucker.css("opacity", "0");
						mysucker.css("transform", "scale(0.5)");
						s = setTimeout(function () {
							lemask.css("visibility", "hidden");
							mysucker.css("visibility", "hidden");
						}, 700);
					});
				}
			}
			req.send(null);
	
		}, 300);
	} else if (window.hasOwnProperty('isPC') && !isPC) {
		
		var splitter = (['<div id="fis_elm__71"><div class="styleguide index-widget-catcaption container">',
			'	<div class="caption">',
			'		<div class="row">',
			'			<div class="-col-auto title -ft-large">Connected: Edge Router</div>',
			'				<div><div class="spliter"></div>',
			'			</div>',
			'		</div>', 
			'	</div>',
			'</div>'].join(""));
			
		var _tag = ['<div class="styleguide index-widget-area-entry container">',
					'<div class="row">',
					'<img class="diversion-icon -col-auto" src="http://s1.map.bdimg.com/mobile/simple/static/index/images/lixianditu_f9f0aa9.png" alt="">',
					'<div class="diversion-txt">',
					'<p class="-ft-large"><b>{{NAME}}</b> - {{ADDR}}</p>',
					'<p>来自 {{SENDER}} - {{TIME}} </p>',
					'</div>',
					'<a class="button -col-auto" style="',
					'    border: 1px solid #2fafff;',
					'    color: #2fafff;',
					'">查看</a>',
					'</div>',
					'</div>',
					'  </div>'].join("");


		function genMobi(obj, target) {
			if (obj.read || obj.action !== "MAP_ACT" || !obj.content) return undefined;
			var content = JSON.parse(obj.content);
			var t = $(_tag.replace("{{NAME}}", content.name)
				.replace("{{ADDR}}", content.addr)
				.replace("{{TIME}}", obj.sendTime)
				.replace("{{SENDER}}", obj.sender));
			t.click(function () {
				console.log("Touching..");
				api("message/touch", [
					[obj.uid]
				], function (e, o) {
					window.location.href = content.uri;
				});
			});
			t.insertAfter(target);
		}



		var _loaded = false;
		var it = setInterval(function(){
			if(_loaded) return;
			
			try{
				$(splitter);
				if(!$(".index-widget-searchbox")[0]){
					return;
				}
				_loaded = true;
			}
			catch(e) {
				return;
			}
			
			clearInterval(it);
			var insertionPoint = $($(".index-widget-searchbox")[0].parentNode);
			var sp = $(splitter); 
		 	sp.insertAfter(insertionPoint);
			 
			for(var i in msgs){
				genMobi(msgs[i], sp);
			}
		}, 300);
		
	}
}