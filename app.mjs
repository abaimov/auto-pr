import puppeteer from "puppeteer";

// Функция для получения текущей даты и времени
function getCurrentDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();
    return `${date} ${time}`;
}

// Функция для мониторинга сайта
async function monitorSite() {
    // Запуск браузера
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    // Переход на страницу
    try {
        await page.goto('https://cars.av.by/bmw/3-seriya', {waitUntil: 'domcontentloaded'});
    } catch (error) {
        console.error('Ошибка загрузки страницы:', error);
        await browser.close();
        return;
    }

    // Функция для получения последней добавленной машины
    const getLastAddedCar = async () => {
        const lastCar = await page.evaluate(() => {
            const carElement = document.querySelector('.listing-item:first-child .link-text'); // Находим первый элемент списка
            return carElement ? carElement.innerText : null; // Возвращаем текст из элемента (название машины)
        });
        return lastCar;
    };

    // Сохранение текущей последней машины
    let lastCar = await getLastAddedCar();
    console.log(`Последняя добавленная машина на момент запуска: ${lastCar}`);

    // Отслеживание изменений каждые 5 секунд
    const intervalId = setInterval(async () => {
        const newLastCar = await getLastAddedCar();

        // Проверяем, есть ли новая машина
        if (newLastCar && newLastCar !== lastCar) {
            lastCar = newLastCar; // Обновляем последнюю машину
            const currentDateTime = getCurrentDateTime(); // Получаем текущую дату и время

            // Выводим сообщение о новой машине
            console.log(`Новая машина добавлена! Название: ${lastCar}, Дата и время: ${currentDateTime}`);
        } else {
            console.log('Новых машин не добавлено');
        }
    }, 2000); // Проверяем каждые 2 секунды

    // Возвращаем данные для управления процессами
    return {browser, intervalId};
}

// Главная функция, которая перезагружает браузер каждые 24 часа
(async () => {
    const ONE_DAY = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

    while (true) {
        // Старт мониторинга
        const {browser, intervalId} = await monitorSite();

        // Ждем один день
        await new Promise((resolve) => setTimeout(resolve, ONE_DAY));

        // Закрываем браузер и очищаем интервал
        clearInterval(intervalId);
        await browser.close();

        console.log('Браузер перезагружается для нового дня...');
    }
})();
