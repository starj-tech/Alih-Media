# ============================================================
# PANDUAN DEPLOYMENT LENGKAP
# Backend Laravel - Aplikasi Alih Media BPN Kabupaten Bogor
# ============================================================

## 📋 Daftar Isi
1. [Persyaratan Server](#persyaratan-server)
2. [Instalasi Step-by-Step](#instalasi)
3. [Konfigurasi Database](#database)
4. [Konfigurasi Laravel](#konfigurasi)
5. [Konfigurasi Nginx](#nginx)
6. [Deploy Frontend React](#frontend)
7. [SSL Certificate](#ssl)
8. [Maintenance](#maintenance)

---

## 1. Persyaratan Server <a name="persyaratan-server"></a>

| Komponen | Minimal | Rekomendasi |
|----------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| RAM | 4 GB | 8 GB |
| CPU | 2 cores | 4 cores |
| Storage | 50 GB SSD | 100 GB SSD |
| PHP | 8.2 | 8.3 |
| PostgreSQL | 15 | 16 |
| Nginx | 1.18+ | latest |
| Node.js | 18+ | 20+ |

---

## 2. Instalasi Step-by-Step <a name="instalasi"></a>

### 2.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install PHP 8.2+ & Extensions
```bash
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php
sudo apt update
sudo apt install -y php8.3 php8.3-fpm php8.3-pgsql php8.3-mbstring \
    php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-gd \
    php8.3-tokenizer php8.3-intl
```

### 2.3 Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

### 2.4 Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2.5 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2.6 Install Node.js (untuk build frontend)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Konfigurasi Database <a name="database"></a>

```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE alihmedia;
CREATE USER alihmedia_user WITH PASSWORD 'password_kuat_anda';
GRANT ALL PRIVILEGES ON DATABASE alihmedia TO alihmedia_user;
\q
```

---

## 4. Konfigurasi Laravel <a name="konfigurasi"></a>

### 4.1 Copy Project
```bash
# Copy folder laravel-backend ke server
cd /var/www
sudo mkdir alihmedia-api
sudo chown $USER:$USER alihmedia-api
# Copy semua file laravel-backend/ ke /var/www/alihmedia-api/
```

### 4.2 Install Dependencies
```bash
cd /var/www/alihmedia-api
composer install --optimize-autoloader --no-dev
```

### 4.3 Setup Environment
```bash
cp .env.example .env
php artisan key:generate

# Edit .env
nano .env
```

Edit `.env`:
```env
APP_NAME="Alihmedia BPN"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.go.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=alihmedia
DB_USERNAME=alihmedia_user
DB_PASSWORD=password_kuat_anda

FRONTEND_URL=https://yourdomain.go.id
```

### 4.4 Run Migrations & Seed
```bash
php artisan migrate --force
php artisan db:seed --class=AdminSeeder
php artisan storage:link
```

### 4.5 Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/alihmedia-api
sudo chmod -R 755 /var/www/alihmedia-api
sudo chmod -R 775 /var/www/alihmedia-api/storage
sudo chmod -R 775 /var/www/alihmedia-api/bootstrap/cache
```

### 4.6 Optimize
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 5. Konfigurasi Nginx <a name="nginx"></a>

### 5.1 Backend API
Buat file `/etc/nginx/sites-available/alihmedia-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.go.id;
    root /var/www/alihmedia-api/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    # API routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # File upload size
    client_max_body_size 10M;

    # Deny hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 5.2 Frontend React
Buat file `/etc/nginx/sites-available/alihmedia-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.go.id;
    root /var/www/alihmedia-frontend/dist;

    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5.3 Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/alihmedia-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/alihmedia-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 6. Deploy Frontend React <a name="frontend"></a>

```bash
# Di mesin development, build frontend
cd /path/to/lovable-project
npm run build

# Copy folder dist/ ke server
scp -r dist/ user@server:/var/www/alihmedia-frontend/dist/
```

**PENTING:** Sebelum build, update `src/lib/api.ts`:
```typescript
const BACKEND_TYPE: BackendType = 'laravel';
const LARAVEL_API_URL = 'https://api.yourdomain.go.id/api';
```

---

## 7. SSL Certificate <a name="ssl"></a>

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.go.id -d api.yourdomain.go.id

# Auto-renew
sudo crontab -e
# Tambahkan:
0 3 * * * certbot renew --quiet
```

---

## 8. Maintenance <a name="maintenance"></a>

### Backup Database (setiap hari)
```bash
# Buat script backup
cat > /home/user/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U alihmedia_user alihmedia > $BACKUP_DIR/alihmedia_$DATE.sql
# Hapus backup lebih dari 30 hari
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
EOF

chmod +x /home/user/backup-db.sh

# Tambahkan ke crontab (setiap hari jam 2 pagi)
crontab -e
0 2 * * * /home/user/backup-db.sh
```

### Update Aplikasi
```bash
cd /var/www/alihmedia-api
git pull # jika pakai git
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
sudo systemctl restart php8.3-fpm
```

### Monitor Log
```bash
# Laravel logs
tail -f /var/www/alihmedia-api/storage/logs/laravel.log

# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart php8.3-fpm
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

---

## ⚠️ Checklist Keamanan

- [ ] Ganti password Super Admin default (`admin123`)
- [ ] Set `APP_DEBUG=false` di production
- [ ] Konfigurasi firewall (UFW)
- [ ] Setup SSL certificate
- [ ] Backup database otomatis
- [ ] Monitor disk space
- [ ] Update system secara berkala

```bash
# Firewall dasar
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```
