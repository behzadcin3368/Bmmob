#!/usr/bin/env bash
# ==============================================================================
# MobOps Fleet Administration - Production Ubuntu Auto-Deploy Script
# Supported OS: Ubuntu 20.04 LTS / 22.04 LTS / 24.04 LTS (x86_64 / aarch64)
# ==============================================================================

set -euo pipefail

# Color Codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

APP_NAME="mobops-fleet"
APP_DIR="/var/www/mobops-fleet"
PORT=3000
NODE_MAJOR=20

echo -e "${CYAN}${BOLD}"
cat << "EOF"
  __  __       _        ___             
 |  \/  | ___ | |__    / _ \ _ __  ___  
 | |\/| |/ _ \| '_ \  | | | | '_ \/ __| 
 | |  | | (_) | |_) | | |_| | |_) \__ \ 
 |_|  |_|\___/|_.__/   \___/| .__/|___/ 
                            |_|          
   Enterprise Fleet Administration Console
   Automated Ubuntu Production Deployment
EOF
echo -e "${NC}"

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# 1. Check Root Privileges
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (or with sudo privileges)."
   echo "Please re-run with: sudo bash $0"
   exit 1
fi

log_info "Detected OS: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"

# 2. System Update & Base Packages
log_info "Updating system packages..."
apt-get update -y
apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    nginx \
    jq \
    tar \
    unzip

log_success "Base dependencies installed."

# 3. Install Node.js & npm (NodeSource LTS)
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
    log_info "Installing Node.js ${NODE_MAJOR}.x LTS..."
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
else
    log_info "Node.js already installed: $(node -v)"
fi

# 4. Install PM2 Globally
if ! command -v pm2 >/dev/null 2>&1; then
    log_info "Installing PM2 process manager globally..."
    npm install -g pm2
    log_success "PM2 installed: $(pm2 -v)"
else
    log_info "PM2 is already installed: $(pm2 -v)"
fi

# 5. Prepare Application Directory
log_info "Setting up application in ${APP_DIR}..."
mkdir -p "${APP_DIR}"

# Check if current directory has the project source files
CURRENT_DIR="$(pwd)"
if [[ -f "${CURRENT_DIR}/package.json" && -f "${CURRENT_DIR}/server.ts" ]]; then
    log_info "Copying files from current directory ${CURRENT_DIR} to ${APP_DIR}..."
    cp -r "${CURRENT_DIR}/." "${APP_DIR}/"
else
    log_info "No local project files detected in current directory. Creating application structure..."
fi

cd "${APP_DIR}"

# Generate Secret Session Token & Env Configuration if missing
if [[ ! -f ".env" ]]; then
    log_info "Generating production .env configuration..."
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date +%s%N | sha256sum | head -c 64)
    SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || hostname -I | awk '{print $1}')
    
    cat > .env << ENV_EOF
NODE_ENV=production
PORT=${PORT}
HOST=0.0.0.0
APP_SECRET=${JWT_SECRET}
SERVER_PUBLIC_HOST=${SERVER_IP}
APP_URL=http://${SERVER_IP}:${PORT}
ENV_EOF
    log_success "Created .env configuration with public host ${SERVER_IP}."
fi

# 6. Install Dependencies & Build
log_info "Installing Node.js dependencies..."
npm install --production=false

log_info "Building production assets (Vite)..."
npm run build || {
    log_warn "Standard build encountered warnings, attempting fallback build..."
    npx vite build
}

# 7. Create PM2 Ecosystem File
log_info "Configuring PM2 ecosystem profile..."
cat > ecosystem.config.cjs << ECO_EOF
module.exports = {
  apps: [
    {
      name: '${APP_NAME}',
      script: 'node_modules/tsx/dist/cli.mjs',
      args: 'server.ts',
      cwd: '${APP_DIR}',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: ${PORT},
        HOST: '0.0.0.0'
      }
    }
  ]
};
ECO_EOF

# 8. Start with PM2 & Register Systemd Auto-Startup
log_info "Starting service with PM2..."
pm2 delete "${APP_NAME}" 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 startup hook
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
pm2 save

# 9. Configure Nginx Reverse Proxy
log_info "Configuring Nginx Reverse Proxy for Port 80 & WebSocket support..."
NGINX_CONF="/etc/nginx/sites-available/${APP_NAME}"

cat > "${NGINX_CONF}" << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
NGINX_EOF

# Enable Nginx site
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

# Test and reload Nginx
if nginx -t >/dev/null 2>&1; then
    systemctl restart nginx
    systemctl enable nginx
    log_success "Nginx reverse proxy configured and active."
else
    log_warn "Nginx config test had notes; running directly on port ${PORT}."
fi

# 10. Firewall Configuration
if command -v ufw >/dev/null 2>&1; then
    log_info "Configuring UFW firewall rules..."
    ufw allow 22/tcp >/dev/null 2>&1 || true
    ufw allow 80/tcp >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
    ufw allow ${PORT}/tcp >/dev/null 2>&1 || true
    ufw --force enable >/dev/null 2>&1 || true
fi

# 11. Final Verification & Status Output
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo -e "${GREEN}${BOLD}   MobOps Fleet Administration Dashboard Successfully Deployed!   ${NC}"
echo -e "${GREEN}${BOLD}==============================================================================${NC}"
echo ""
echo -e "  ${BOLD}Web Dashboard:${NC}    http://${SERVER_IP}  (or http://${SERVER_IP}:${PORT})"
echo -e "  ${BOLD}API Endpoint:${NC}     http://${SERVER_IP}/api/fleet/status"
echo -e "  ${BOLD}Install Directory:${NC} ${APP_DIR}"
echo ""
echo -e "${CYAN}${BOLD}Useful PM2 Management Commands:${NC}"
echo -e "  ${YELLOW}pm2 status${NC}                - View process status"
echo -e "  ${YELLOW}pm2 logs ${APP_NAME}${NC}        - View live output and connection logs"
echo -e "  ${YELLOW}pm2 restart ${APP_NAME}${NC}     - Restart server"
echo -e "  ${YELLOW}pm2 stop ${APP_NAME}${NC}        - Stop server"
echo ""
echo -e "${CYAN}${BOLD}SSL / HTTPS Setup (Optional via Certbot):${NC}"
echo -e "  If you have a domain pointing to this server IP, run:"
echo -e "  ${YELLOW}certbot --nginx -d yourdomain.com${NC}"
echo ""
echo -e "${GREEN}System is ready for enrolled devices and remote administration.${NC}"
EOF
