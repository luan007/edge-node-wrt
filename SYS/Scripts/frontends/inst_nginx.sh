#!/bin/bash

export LUAJIT_LIB=/opt/luajit
export LUAJIT_INC=/staging/lua-ngx/LuaJIT-2.0.3/src

 
# Here we assume Nginx is to be installed under /opt/nginx/.
./configure --prefix=/opt/nginx \
            --with-ld-opt='-Wl,-rpath,/opt/luajit' \
            --add-module=/staging/lua-ngx/ngx_devel_kit-0.2.19 \
            --add-module=/staging/lua-ngx/lua-nginx-module-0.9.14
 
make -j2
make install
