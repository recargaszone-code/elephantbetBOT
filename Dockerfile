FROM node:20-slim

# Instala Chromium + xvfb (display fake) + libs mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    xvfb \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 \
    libxcomposite1 libxdamage1 libxext6 libxfixes3 libxrandr2 \
    libx11-xcb1 libxcb-dri3-0 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Roda com xvfb-run pra criar display virtual headless
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1280x800x24", "npm", "start"]
