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

/*
Accessibility scan data container - start
==========================================
"AMP" refers to Accessibility Management Platform, the resource at https://att.levelaccess.net/index.php
*/
const ampReportData = {};

//Contains the AccessibilityConcern class instance
//Type: AccessibilityConcern
//More info at https://tools.levelaccess.net/continuum/docs/latest/jsdoc/index.html
ampReportData.accessibilityConcerns = null;

//The AMP Asset container
//Type: Integer
//For dev, use 38837 - the "ScanTest" asset
//For prod, use 38741 - "Continuum-StrategicPlatforms" asset
ampReportData.activeAsset = 38837;

//The overall AMP Organization
//Type: Integer
//For dev, use 10003 - the "Continuum Users" org
//For prod, use 1112 - the "Working" org
ampReportData.activeOrg = 10003;

//The submit state
//Type: Varies - string if successful, error object if not successful
ampReportData.ampSubmitState = null;

//HTML page title (if available)
//Type: String
ampReportData.pageTitle = "";

//Release information
//Type: TBD
//Since this is not settled yet, format is TBD. This could be an array
//or whatever best accommodates the data.
ampReportData.releaseInfo = "release info format TBD";

//Email addresses(?) for responsible product team
//Type: TBD, probably an array of string
//This is not settled yet since we don't know what this information 
//looks like - could be email addresses, exchange mail box addresses, etc.
ampReportData.responsibleTeamInfo = "responsible team info format TBD";

//The date of the report
//Type: String
//@see sendAccessibilityConcernsToAMP() for specific use 
ampReportData.reportDate = "";

//The name of the report added to the AMP asset.
//Type: String
ampReportData.reportName = "";

//The URL for each page analyzed for each module (web page) instantiated by the selenium driver
ampReportData.url = ""; 

/*
let urlsToScan = [
    {
        url: "https://www.nps.gov",
        scanned: false
    }
    
];
*/


let urlsToScan = [
    {
        url: "https://www.nps.gov",
        scanned: false
    },
    {
        url: "https://www.irs.gov/",
        scanned: false
    }
    
];

async function runScan_start() {
    
    const scanListLen = urlsToScan.length;
    
    //setContinuum();

    for (let i=0; i<scanListLen; i++) {
        console.log( "now scanning: ", urlsToScan[i].url );
        urlsToScan[i].scanned = true;
        await driver.get( urlsToScan[i].url ).then(runScan_postInitialize, runScan_start_failed);
    };

}

async function runScan_start_failed() {

    console.log( "runScan_start_failed" );

}

async function runScan_postInitialize() {

        //await setContinuum();
        await Continuum.setUp(driver, require('path').resolve(__dirname, "./continuum.conf.js"), null).then(runScan_getResults,runScan_postInit_failed);

}


async function runScan_postInit_failed() {

    console.log( "runScan_postInit_failed" );

}

async function runScan_getResults() {

    await getScanResults().then(scanResultsFound, scanResultsNotFound);

}

async function getScanResults() {
    let result = await Continuum.runAllTests();
}

async function scanResultsFound() {
    let accessibilityConcerns = await Continuum.getAccessibilityConcerns();
    //console.log("Scan results: ", accessibilityConcerns);
    console.log("Scan results length: ", accessibilityConcerns.length);    
    await sendAccessibilityConcernsToCTXAx( accessibilityConcerns );
    await postScanCleanup();
}

function scanResultsNotFound()  {
    console.log( "Scan failed");
}


let postScanCleanup = () => {
    const scanListLen = urlsToScan.length;
    let allUrlsScanned = true;

    for (let i=0; i<scanListLen; i++) {
        if ( !urlsToScan[i].scanned ) {
            allUrlsScanned = false;
            break;
        }
    };

    if ( allUrlsScanned ) driver.quit();
}



try {
    
    runScan_start();
    //console.log( "scan results: ", result);

} catch( error ) {

    console.log("An error occurred: ", error);

}

/**
 * Submits accessibility concerns to the SPT Accessibility intake page. Intake page simply
 * returns JSON success property with true or false result.
 * @param {Object} ampReportData
 */
async function sendAccessibilityConcernsToCTXAx( ampReportData ) {

	
	//console.log(JSON.stringify(ampReportData, null, 2)); //easier to read
	//console.log( ampReportData);
    //console.log( "ampReportData:", ampReportData[0].rawEngineJsonObject );
    
	//had to use this approach since this is not a module
	const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	const sptIntakeUrl = 'http://localhost/ax_dash_pg/cal/apps/aud/scanpost/index.php';

    let status;
    await fetch( sptIntakeUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ampReportData)
    } )
        .then( (response) => {
            status = response.status;
            return response.json();
        })
        .then((jsonResponse) => {
            console.log( JSON.stringify( jsonResponse ) );
            console.log(status);
        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

}
