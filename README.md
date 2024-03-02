# webserver

## cronjob for letsEncript
0 3 * * * certbot renew --quiet --post-hook "systemctl restart serverrpi.service"
