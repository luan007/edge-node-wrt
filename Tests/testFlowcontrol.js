require('../SYS/Env');

console.log("#1 setTaskWithCb normal usage");

var clock = 0;
setInterval(function(){
	console.log("CLOCK: " + (++clock));
}, 1000);





setTaskWithCb("demo", function(cb){
	console.log("Calling Function Body (should be 3 sec)");
	setTimeout(function(){
		console.log("Done Job #1");
		console.log("Otherone should queue up for another 1sec");
		cb();
	}, 3000);
}, 3000);



setTimeout(function(){
	console.log("Concurrent Job adding to queue");
	setTaskWithCb("demo", function(cb){
		console.log("Job #2 is Wrong");
		cb();
	}, 1000);
}, 4000)


setTimeout(function(){
	console.log("Concurrent Job adding to queue");
	setTaskWithCb("demo", function(cb){
		console.log("Job #2 Coming");
		cb();
	}, 1000);
}, 5000)


setTimeout(function(){
	console.log("Serial Add-");
	setTaskWithCb("demo", function(cb){
		console.log("THIS SHOULD NOT COME");
		cb();
	}, 100);
	setTaskWithCb("demo", function(cb){
		console.log("THIS SHOULD NOT COME");
		cb();
	}, 100);
	setTaskWithCb("demo", function(cb){
		console.log("THIS SHOULD NOT COME");
		cb();
	}, 100);
	setTaskWithCb("demo", function(cb){
		console.log("Correct Job Called");
		cb();
		setTaskWithCb("demo", function(cb){
			console.log("This should not show up");
			cb();
		}, 1000);
		console.log("Clearing Task - " + clearTaskWithCb("demo"));
		
		
		setTaskWithCb("demo", function(cb){
			console.log("This should show up");
			setTimeout(function(){
				cb();
			}, 1000);
		}, 1000);
		setTimeout(function(){
			console.log("Clearing Task when Running (Should Fail)");
			console.log(!clearTaskWithCb("demo") ? "Right": "Wrong");			
		}, 1200);
	}, 2000);
}, 10000)


