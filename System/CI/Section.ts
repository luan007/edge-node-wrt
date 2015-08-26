export class SectionHandler {
    private _cache = {};

    constructor(private key:string) {
    }

    Write(row:string, val?:any) {
        this._cache[row] = this._cache[row] || [];
        this._cache[row].push(val !== undefined ? row + "=" + val : row);
    }

    Flush(cb) {
        var realpath = global.ConfigRealPath(this.key);
        var content = "";
        for(var k in this._cache) {
            for(var i in this._cache[k])
                content += this._cache[k][i] + "\n";
        }
        //console.log(realpath.blue, content);
        fs.writeFile(realpath, content, (err)=> {
            if(err) console.log(err.message["red"]);
            this._cache = {};
            cb();
        });
    }
}

var sections = {};
export function GetSection(key) :SectionHandler {
    if (!has(sections, key))
        sections[key] = new SectionHandler(key);
    return sections[key];
}