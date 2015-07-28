var devs = {};

api("device/all", [], function(e, o){
	o = o.result;
	devs = {};
	for(var i in o){
		if(o[i].actions && o[i].actions.adjust){
			console.log(o[i]);
			for(var k in o[i].actions.adjust){
				if(k !== "value") {
					devs[i] = k;	
					
				}
			}
		}
	}
	console.log(devs);
	dirtyjob();
});


function dirtyjob(){
	var t = setInterval(function(){
		
		console.log("ALOHA");
		
		
		try{
			$("#lightoff");
		}catch(e){
			return;
		}
		
		if(!document.getElementById("lightoff") || !document.getElementById("lighton")) {
			return;
		}
		
		document.getElementById("lightoff").onclick = function() {
			console.log("Lights Off!");
			for(var i in devs){
				api("driver/invoke", [devs[i], i, 'adjust', {
					red: 255, green: 255, blue: 50, brightness: 0
				}], function(){
					console.log(arguments);
				})
			}
		};
		
		
		var oldon = document.getElementById("lighton").onclick;
		
		document.getElementById("lighton").onclick = function() {
			console.log("Lights On!");
			oldon();
			for(var i in devs){
				api("driver/invoke", [devs[i], i, 'adjust', {
					red: 255, green: 255, blue: 50, brightness: 100
				}], function(){
					console.log(arguments);
				})
			}
			
		};
		
		
		
		clearTimeout(t);
		
	}, 300);
}