// main_modified.js
const { startParsing } = require('./matchParser');

let isRunning = false;

async function run() {
    if (!isRunning) {
        console.log('Запускаю цикл парсинга...');
        isRunning = true;
    } else {
        console.log('Цикл уже выполняется, пропускаю...');
        return;
    }
    try {
        const processedCount = await startParsing();
        console.log('Цикл парсинга завершен, обработано матчей:', processedCount);
        
        console.log('Жду 1.5 минуты перед следующим циклом...');
        setTimeout(() => { isRunning = false; run(); }, 90000);
    } catch (error) {
        console.error('Ошибка в цикле парсинга:', error);
        isRunning = false;
        console.log('Жду 2 минуты перед перезапуском...');
        setTimeout(run, 120000);
    }
}

async function startScript() {
    if (!isRunning) {
        console.log('Скрипт запущен...');
        run();
    } else {
        console.log('Скрипт уже запущен.');
    }
}

function stopScript() {
    if (isRunning) {
        isRunning = false;
        console.log('Останавливаю скрипт...');
        process.exit(0);
    } else {
        console.log('Скрипт уже остановлен.');
    }
}

const args = process.argv.slice(2);
if (args[0] === 'start') {
    startScript();
} else if (args[0] === 'stop') {
    stopScript();
} else {
    console.log('Используйте: node main_modified.js start | stop');
}

process.on('SIGINT', () => {
    console.log('Получен сигнал остановки (SIGINT)...');
    stopScript();
});