/**
Test file to see if we can run the scan without the test bed intervening.
*/

//Load primary constants
const seleniumWebdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

//const {setWorldConstructor, setDefaultTimeout} = require('cucumber');

//inserted by gb1175 1/27/22 to prevent CLI message clutter
//also includes the ".setChromeOptions() line below"

const options = new chrome.Options();
options.excludeSwitches(['enable-logging']);

	
let driver = new seleniumWebdriver.Builder()
		.withCapabilities(seleniumWebdriver.Capabilities.chrome())
		.setChromeOptions(options)
        .build();

//setDefaultTimeout(60 * 1000);

//Load Continuum
const {Continuum, ReportManagementStrategy, ModuleManagementStrategy} = require('@continuum/continuum-javascript-professional');

//Just send Chrome to a URL
driver.get( "https://www.nps.gov" );

async function setContinuum() {
    await Continuum.setUp(driver, "continuum.conf.js", null);
}

async function getScanResults() {
    let result = await Continuum.runAllTests();
}

function scanResultsFound() {
    let accessibilityConcerns = Continuum.getAccessibilityConcerns();
    console.log("Scan results: ", accessibilityConcerns);
    driver.quit();
}

function scanResultsNotFound()  {
    console.log( "Scan failed");

}



try {
    
    setContinuum();
    getScanResults().then(scanResultsFound, scanResultsNotFound);
    //console.log( "scan results: ", result);

} catch( e ) {

    console.log("An error occurred: ", e);

}


//driver.quit();