import airplay = require('./airplay');

export function Initialize(cb){
    var server:any = airplay.Add('Test', 1);
    if(typeof server === 'number')
        return console.log('▂▃▅▆█ airplay failed'['yellowBG'].bold, server);
    else{
        console.log('▂▃▅▆█ airplay port'['yellowBG'].bold, server.GetPort());
        server.on('state', (msg)=>{
            console.log('▂▃▅▆█ airplay', msg);
        });
    }
    cb();
}
