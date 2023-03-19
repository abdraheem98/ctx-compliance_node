const {After} = require('cucumber');

After(function() {
    return this.driver.quit();
});