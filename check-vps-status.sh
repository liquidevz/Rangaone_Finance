#!/bin/bash
echo "=== VPS Status Check ==="

echo "1. Docker containers:"
docker ps

echo -e "\n2. Port 3000 status:"
netstat -tlnp | grep :3000

echo -e "\n3. App health check:"
curl -I http://localhost:3000/api/health

echo -e "\n4. Nginx status:"
systemctl status nginx

echo -e "\n5. CloudPanel nginx config:"
cat /etc/nginx/sites-enabled/www.rangaone.finance.conf | grep -A 10 -B 5 "location /"

echo -e "\n6. Test direct app access:"
curl -I http://localhost:3000

echo -e "\n7. Test domain access:"
curl -I http://www.rangaone.finance