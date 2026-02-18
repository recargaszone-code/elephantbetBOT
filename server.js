const puppeteer = require('puppeteer');
const express = require('express');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const port = process.env.PORT || 3000;

// === CONFIG TELEGRAM ===
const TELEGRAM_TOKEN = '8583470384:AAF0poQRbfGkmGy7cA604C4b_-MhYj-V7XM';  // ← COLA TEU TOKEN AQUI
const CHAT_ID = '7427648935';  // ← COLA TEU CHAT_ID AQUI (ou ID do grupo)

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });  // polling false pra não consumir recursos

// Variáveis do bot
let browser;
let page;
let historicoAntigo = new Set();
let multiplicadores = [];

// Função pra enviar mensagem Telegram
async function enviarTelegram(mensagem) {
  try {
    await bot.sendMessage(CHAT_ID, mensagem, { parse_mode: 'HTML' });
    console.log('[TELEGRAM] Mensagem enviada:', mensagem);
  } catch (err) {
    console.error('[TELEGRAM ERRO]', err.message);
  }
}

// Função principal
async function iniciarBot() {
  try {
    console.log('[BOT] Iniciando Puppeteer...');

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });

    page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const url = 'https://m.888bets.co.mz/pt/games/detail/casino/normal/7787';
    console.log(`[BOT] Abrindo: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log('[BOT] Esperando iframe...');
    await page.waitForSelector('iframe', { timeout: 60000 });

    const iframeElement = await page.$('iframe');
    const frame = await iframeElement.contentFrame();
    if (!frame) throw new Error('Iframe sem contentFrame');

    console.log('[BOT] No iframe! Monitorando histórico...');

    // Loop de monitoramento
    setInterval(async () => {
      try {
        const payouts = await frame.$$eval(
          'div.payout.ng-star-inserted, .payout, [appcoloredmultiplier], .multiplier-history span, .crash-history-item',
          els => els.map(el => el.innerText.trim())
        );

        const novos = [];
        payouts.forEach(texto => {
          if (texto.includes('x')) {
            const valorStr = texto.replace('x', '').trim().replace(',', '.');
            const valor = parseFloat(valorStr);
            if (!isNaN(valor)) {
              const key = valor.toFixed(2);
              if (!historicoAntigo.has(key)) {
                historicoAntigo.add(key);
                const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
                multiplicadores.push({ timestamp, valor });
                novos.push(valor);

                let msg = `🕒 ${timestamp} | NOVO MULTIPLICADOR: <b>${valor}x</b>`;
                if (valor >= 50) {
                  msg = `🚀🚀 FOGUETÃO INSANO! ${valor}x 🚀🚀\n${msg}`;
                } else if (valor >= 10) {
                  msg = `🔥 BOA! ${valor}x 🔥\n${msg}`;
                }

                console.log(`[${timestamp}] NOVO: ${valor}x`);
                enviarTelegram(msg);  // Envia pro Telegram
              }
            }
          }
        });

        if (novos.length > 0) {
          console.log(`Novos detectados: ${novos.join(', ')}`);
          fs.writeFileSync('historico.json', JSON.stringify(multiplicadores, null, 2));
          console.log('historico.json atualizado');
        }

      } catch (err) {
        console.error('[ERRO no loop]', err.message);
      }
    }, 5000);

    // Mensagem inicial no Telegram pra confirmar que subiu
    enviarTelegram('🤖 Aviator Monitor ONLINE no Render! Monitorando histórico 24/7 🔥');

  } catch (err) {
    console.error('[ERRO FATAL]', err);
    if (browser) await browser.close();
  }
}

// Rota status pro Render manter vivo
app.get('/', (req, res) => {
  res.send(`
    <h1>Aviator Monitor Node.js</h1>
    <p>Status: Rodando</p>
    <p>Capturados: ${multiplicadores.length}</p>
    <p>Últimos: ${multiplicadores.slice(-5).map(m => m.valor + 'x').join(', ')}</p>
  `);
});

app.listen(port, () => {
  console.log(`Servidor na porta ${port}`);
  iniciarBot();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido. Fechando...');
  if (browser) await browser.close();
  process.exit(0);
});