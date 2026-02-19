FROM node:20-slim

# Atualiza e instala xvfb + chromium + todas as libs críticas (mais completas pra evitar dbus/X crash)
RUN apt-get update && apt-get install -y --no-install-recommends \
    xvfb \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    fonts-liberation \
    libdbus-1-3 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Variáveis pro Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    DISPLAY=:99

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Roda com xvfb-run pra criar display virtual e força path completo
CMD ["xvfb-run", "--server-args=-screen 0 1280x800x24", "--auto-servernum", "node", "server.js"]
