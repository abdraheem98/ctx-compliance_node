const seleniumWebdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

const {setWorldConstructor, setDefaultTimeout} = require('cucumber');

function CustomWorld() {
	this.driver = new seleniumWebdriver.Builder()
		.withCapabilities(seleniumWebdriver.Capabilities.chrome())
		.build();
}

setDefaultTimeout(60 * 1000);
setWorldConstructor(CustomWorld);