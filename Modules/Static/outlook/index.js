var devs = {};

api("device/all", [], function(e, o){
	o = o.result;
	devs = {};
	for(var i in o){
		if(o[i].actions && o[i].actions.dial){
			console.log(o[i]);
			for(var k in o[i].actions.dial){
				if(k !== "value") {
					devs[i] = k;
				}
			}
		}
	}
	console.log(devs);
	dirtyjob();
});









var mask = ['<div id="lemask" style="',
'    position: fixed;',
'    top: 0;',
'    right: 0;',
'    left: 0;',
'    bottom: 0;',
'    z-index: 9999999;',
'    background: black;',
'    opacity: 0;',
'    transition: all 0.5s ease; display:none;',
'"></div>'].join("");

var unit = ['<div style="',
'    height: 80px;',
'    border-bottom: 1px solid #E7E7E7;',
'    display: table;',
'    table-layout: fixed;',
'    width: 100%;',
'            "><div style="',
'    display: table-cell;',
'    text-align: center;',
'    vertical-align: middle;',
'    width: 50px;',
'    background: #ECECEC;',
'">',
'  <i class="fa fa-mobile" style="',
'    font-size: 2.5em;',
'    color: #A0A0A0;',
'                               ',
'    margin-bottom: -20px;',
'    display: inline-block;',
'"></i><div></div><div style="',
'    display: inline-block;',
'    height: 2px;',
'    width: 15px;',
'    border-radius: 999999px;',
'    box-shadow: 0px 0px 10px rgba(20, 223, 76, 1);',
'    background: #2FBD2C;',
'"></div>',
'</div>',
].join("") +  ['  <div style="display: table-cell;',
'    vertical-align: middle;',
'    padding-left: 15px;',
'padding-right: 15px;"><div style="',
'    font-size: 1.5em;',
'    overflow: hidden;',
'    white-space: nowrap;',
'    text-overflow: ellipsis;',
'    margin: 3px 0;',
'    color: #515151;',
'    top: -2px;',
'    position: relative;',
'">{{NAME}}</div><div style="',
'    font-size: 0.8em;',
'    color: #BBB;',
'    "><i class="fa fa-signal"></i> {{NETWORK}}</div></div></div>',
].join("");


var main = ['<div style="',
'    position: absolute;',
'    /* height: 280px; */',
'    width: 250px;',
'    background: white;',
'    z-index: 999999999;',
'    box-shadow: 0px 0px 3px rgba(0,0,0,0.5);',
'    left: 30px;',
'    font-family: \'helvetica\',\'microsoft yahei ui\', \'microsoft yahei ui light\', sans-serif;',
'    transition: all 0.5s ease;',
'    transform: scale(0.5); opacity: 0; display:none;',
'">',
'  <div style="',
'    height: 50px;',
'    background: #0072C6;',
'    line-height: 50px;',
'    font-size: 1.2em;',
'    color: #FFF;',
'    padding-left: 15px;',
'    font-weight: lighter;',
'                               "><i class="fa fa-phone" style="',
'    padding-right: 10px;',
'    font-size: 1.2em;',
'    line-height: 50px;',
'    vertical-align: top;',
'    opacity: 1;',
'"></i><div style="display:inline" id="lephonenum">18697140665</div></div><div class="insertion_zone">',
' </div>',
'  ',
'  ',
'  ',
'  <div style="',
'    height: 25px;',
'    line-height: 25px;',
'    font-size: 12px;',
'    padding-right: 5px;',
'    color: #818181;',
'    text-align: right;',
'">Powered by Edge</div>',
'</div>',
].join("");



var last = undefined;
var reg = /(13[0-9]|14[0-9]|15[0-9]|18[0-9])\d{8}/i;
var reg2 = /((\+?86)|(\(\+86\)))?\d{3,4}-\d{7,8}(-\d{3,4})?/i;

function regreplace(reg, t){
	var next = t;
	var all = "";
	var stack = 0;
	while(reg.test(next)){
		if(stack++ > 10) break;
		var m = t.match(reg);
		var start = m.index;
		var end = m[0].length + start;
		all += next.substr(0, start) + "<a onclick='popop(\"" + m[0] + "\", this);' style='border: 1px solid #2fafff;border-radius: 5px;background: #2fafff;color: white;padding: 0 5px;cursor: pointer'>" + m[0] + "</a>";
		next = next.substr(end);
	}
	all += next;
	return all;
}

function job(){
	console.log(last);
	var all = $("a, p, b, pre, span");
	for(var i = 0; i < all.length; i++){
		var cur = $(all[i]);
		var t = all[i].innerText;
		if(reg.test(t) || reg2.test(t)){
			t = regreplace(reg, t);
			t = regreplace(reg2, t);
			cur.get(0).innerHTML = t;
		}
	}
}

function scan(){
	var d = $(".rpHighlightSubjectClass")[0];
	if(!d) return;
	
	if(!last || d.innerHTML !== last){
		last = d.innerHTML;
		job();
	}
}


var insert = "<div></div>";

function dirtyjob(){
	
	var me = setInterval(function(){
		if(!window["$"]){
			return;
		}
		clearInterval(me);
		
		var _main = $(main);
		var _mask = $(mask);
		
		
		
		_mask.appendTo($("body"));
		_main.appendTo($("body"));
		
		var timer = undefined;
		_mask.click(function(){
			_mask.css("opacity", 0);
			_main.css("transform", "scale(0.5)").css("opacity", 0);
			clearTimeout(timer);
			timer = setTimeout(function(){
				_mask.css("display", "none");
				_main.css("display", "none");
			}, 1000);
		});
		
		window.popop = function(num, t){
			_mask.css("display", "block");
			_main.css("display", "block");
			var caller = $(t);
			if(caller){
				_main.css("top", caller.offset().top - _main.height() - 5);
				_main.css("left", caller.offset().left - _main.width() / 2);
			}
			$("#lephonenum").text(num);
			clearTimeout(timer);
			setTimeout(function(){
			_mask.css("opacity", 0.3);
			_main.css("transform", "scale(1)").css("opacity", 1);
			}, 1);
		};
		
		setInterval(scan, 500);
	});

}