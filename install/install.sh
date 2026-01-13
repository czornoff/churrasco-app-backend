sudo apt update && sudo apt upgrade -y
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 1 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 27017 -j ACCEPT
sudo netfilter-persistent save

sudo apt install nginx -y
sudo apt install netstat
sudo apt install certbot python3-certbot-nginx -y

curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor --yes
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get install -y mongodb-org

sudo systemctl start mongod
sudo systemctl enable mongod
sudo systemctl daemon-reload

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts

mkdir projetos
cd projetos
git clone https://github.com/czornoff/churrasco-app-frontend.git
git clone https://github.com/czornoff/churrasco-app-backend.git
cd churrasco-app-backend/
npm install -g npm@11.7.0
npm install -g pm2
pm2 start server.js --name "churrasco-backend"

cd  ../churrasco-app-frontend/
npm install
npm run build

sudo gpasswd -a www-data ubuntu
chmod +x /home/ubuntu
chmod +x /home/ubuntu/projetos
chmod +x /home/ubuntu/projetos/churrasco-app-frontend
chmod -R 755 /home/ubuntu/projetos/churrasco-app-frontend
chmod -R 755 /home/ubuntu/projetos/churrasco-app-backend/

sudo vi /etc/nginx/sites-available/churrasco-app
sudo ln -s /etc/nginx/sites-available/churrasco-app /etc/nginx/sites-enabled/

sudo systemctl restart nginx

sudo certbot --nginx -d calculadorachurrasco.bandalarga.com.br -d api-churrasco.bandalarga.com.br
systemctl list-timers | grep certbot
sudo certbot renew --dry-run

mongosh
sudo vi /etc/mongod.conf
sudo systemctl restart mongod

mongosh "mongodb://admin:U%25Y%5E8XtEs9wLGwqU27VFh78Zi%235%40zPfw@127.0.0.1:27017/?authSource=admin"

mongosh --username admin --password --authenticationDatabase admin
mongosh --username churrasco-admin --password --authenticationDatabase admin

mongosh "mongodb://churrasco-user-001:Z7EC6Fe%24tXPa%409WF@127.0.0.1:27017/calculadora-db-001?authSource=admin"