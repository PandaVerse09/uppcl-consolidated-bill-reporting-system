#!/bin/bash
# Redirect all output to log file for debugging
exec > >(tee -i /var/log/user-data.log) 2>&1

echo "=== Starting Automated Deployment ==="

# 1. Update packages and install core deps
apt-get update -y
apt-get upgrade -y
apt-get install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

# 2. Install Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add ubuntu user to docker group so they can run docker without sudo
usermod -aG docker ubuntu


# 3. Create application folder and configuration
mkdir -p /home/ubuntu/uppcl-drmp
cd /home/ubuntu/uppcl-drmp

# Write the production .env file
cat << 'EOF' > .env
PORT=80
MONGO_URI=mongodb+srv://pandaverze:NmZr9QkuwfPmnEvQ@complete-backend.lptkt6u.mongodb.net/cbs
JWT_SECRET=34637c53a485ffa6dec7e5cd6eac1fd98f8ecf35cac6554e5be0730c0c3d2bad
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@uppcl.in
ADMIN_PASSWORD=Admin@12345
EOF

chown -R ubuntu:ubuntu /home/ubuntu/uppcl-drmp

# 4. Pull and run the Docker container
docker pull pandaverze/uppcl-drmp:latest
docker run -d \
  --name uppcl-drmp \
  --restart always \
  --env-file .env \
  -p 5000:80 \
  pandaverze/uppcl-drmp:latest

# 5. Configure Nginx Reverse Proxy
cat << 'EOF' > /etc/nginx/sites-available/uppcl-drmp
server {
    listen 80;
    server_name _; # Will accept any IP or domain initially

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
EOF

# Enable the config & restart Nginx
ln -s /etc/nginx/sites-available/uppcl-drmp /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "=== Automated Deployment Complete ==="
