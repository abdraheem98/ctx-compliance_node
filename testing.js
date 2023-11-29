process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
});

// Load Selenium Web Driver
const {Builder, By, Key, until} = require('selenium-webdriver');

// run
(async function example() {
    let driver = await new Builder().forBrowser("chrome").build();
    try {
        await driver.get('http://www.google.com/ncr');
        await driver.findElement(By.name('q')).sendKeys('You did it!!', Key.RETURN);
        await driver.wait(until.titleIs('You did it!! - Google Search'), 1000);
    } catch (error) {
        // Handle the error here
        console.error('An error occurred:', error);
    } finally {
        await driver.quit();
    }
})();