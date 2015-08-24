var _section_conf_path = "/ramdisk/System/CI/SectionConf.json";
var _section_conf = {};
function _load_section_conf() {
    try {
        _section_conf =  JSON.parse(fs.readFileSync(_section_conf_path).toString());
    } catch(err){
        throw new Error("Section conf error: " + err.message);
    }
}
_load_section_conf();

function _get_real_path(key:string) {
    return _section_conf[key] && _section_conf[key].path;
}

export class SectionHandler {
    private _cache = {};

    constructor(private key:string) {
    }

    Write(row:string, val?:any) {
        this._cache[row] = (val ? row + "=" + val : row);
    }

    Flush(cb) {
        var realpath = _get_real_path(this.key);
        var content = "";
        for(var k in this._cache) {
            content += this._cache[k] + "\n";
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
export function Reload() {
    _load_section_conf();
}