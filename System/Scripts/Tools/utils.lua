local cjson = require "cjson"

utils = {}

function utils.exec(cmd)
    return io.popen(cmd):read()
end

function utils.split(s, p)
    local rt= {}
    string.gsub(s, '[^'..p..']+', function(w) table.insert(rt, w) end )
    return rt
end

function utils.concat(t1,t2)
    for i=1,#t2 do
        t1[#t1+1] = t2[i]
    end
    return t1
end

function utils.append(t1, s)
    table.insert(t1, s)
    return t1
end

function utils.contains(t1, s)
    for _, v in pairs(t1) do
      if(v == s) then
        return true
      end
    end
    return false
end

function utils.trimend(s1, s2)
    return string.gsub(s1, s2.."$", "")
end

function utils.iterate(t)
    for k, v in pairs(t) do
        print(k, v)
    end
end

function utils.parse(text)
    return cjson.decode(text)
end

function utils.stringify(obj)
    return cjson.encode(obj)
end

function utils.md5(str)
    return utils.exec("echo \""..str.."\" | md5sum | awk '{print $1}'")
end

function utils.md5file(path)
    return utils.exec("md5sum "..path.." | awk '{print $1}'")
end

function utils.md5compare(path, str)
    local md5f = utils.md5file(path),
          md5s = utils.md5(str)
    print("[md5]", path, md5f, "string:", md5s);
    return md5f == md5s
end

return utils
