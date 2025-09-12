# webserver

## cronjob for letsEncript
0 3 * * * certbot renew --quiet --post-hook "systemctl restart serverrpi.service"

## WELL ADD POST SCRIPT TO SEND EMAIL ON RENEW
