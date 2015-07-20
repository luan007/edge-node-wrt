####nginx
echo nginx operation
mkdir -p /var/tmp/nginx
chmod 755 /var/tmp/nginx
killall nginx
cp -rf Scripts/Frontend/nginx.conf /etc/nginx/nginx.conf
if [ ! -e /var/log/nginx ]; then mkdir -p /var/log/nginx ; fi