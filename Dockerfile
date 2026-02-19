FROM node:20-slim

# Atualiza e instala Chromium + todas as dependências que o Puppeteer precisa
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Configura Puppeteer pra usar o Chromium instalado (não tenta baixar)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Roda o bot

CMD ["xvfb-run", "--auto-servernum", "--server-args='-screen 0 1280x800x24'", "npm", "start"]
