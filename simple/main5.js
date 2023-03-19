/**
Test file to see if we can run the scan without the test bed intervening.
*/

//Load primary resources
const seleniumWebdriver = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const path = require('chromedriver').path;
const service = new chrome.ServiceBuilder(path).build();
chrome.setDefaultService(service);

//inserted by gb1175 1/27/22 to prevent CLI message clutter
//also includes the ".setChromeOptions() line below"
const options = new chrome.Options();
options.excludeSwitches(['enable-logging']);

//load the Chrome driver
let driver = new seleniumWebdriver.Builder()
		.withCapabilities(seleniumWebdriver.Capabilities.chrome())
		.setChromeOptions(options)
        .build();

//Load Continuum lib
const {Continuum, ReportManagementStrategy, ModuleManagementStrategy} = require('@continuum/continuum-javascript-professional');


//Set URLs to scan
//==============================


let urlsToScan = [
    {
        url: "https://www.nps.gov",
        scanned: false
    }
    
];


/*
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
*/


//STEP 1 - Get Urls
//=====================================

try {
    
    getUrls_start();

} catch( error ) {

    console.log("An error occurred: ", error);
    
}

async function getUrls_start() {

    await( getUrlsToScan() ).then( runScan_start, getUrls_failed );

};

async function getUrls_failed() {
    console.log("URL Retrieval failed");
};

//STEP 2 - Start scan run
//=====================================

async function runScan_start() {

    console.log( "URLs to scan: ", urlsToScan );
    
    const scanListLen = urlsToScan.length;

    for (let i=0; i<scanListLen; i++) {
        console.log( "now scanning: ", urlsToScan[i].url );
        urlsToScan[i].scanned = true;
        await driver.get( urlsToScan[i].url ).then(runScan_postInitialize, runScan_start_failed);
    };

}


//STEP 3 - Set Up Continuum
//=====================================

async function runScan_postInitialize() {
    
    //await setContinuum();
    await Continuum.setUp(driver, require('path').resolve(__dirname, "./continuum.conf.js"), null).then(runScan_getResults,runScan_postInit_failed);
    
}

async function runScan_start_failed() {

    console.log( "runScan_start_failed" );

}


//STEP 4 - Request scan results
//=====================================

async function runScan_getResults() {
    
    await getScanResults().then(scanResultsFound, scanResultsNotFound);
    
}

async function getScanResults() {
    await Continuum.runAllTests();
}    

async function runScan_postInit_failed( error ) {
    console.log( "runScan_postInit_failed. error: ", error );
}

//STEP 5 - Run scans
//=====================================

async function scanResultsFound() {
    let accessibilityConcerns = await Continuum.getAccessibilityConcerns();

    //move the fingerprint object into the main object so it can be converted to JSON
    issLen = accessibilityConcerns.length;
    for ( let i=0; i<issLen; i++ ) {
        accessibilityConcerns[i]._fingerprint = accessibilityConcerns[i]._rawEngineJsonObject.fingerprint
    }

    //console.log("Scan results: ", accessibilityConcerns);
    console.log("Scan results length: ", accessibilityConcerns.length);    
    console.log("Scan results: ", accessibilityConcerns[0]);    
    //await sendAccessibilityConcernsToCTXAx( accessibilityConcerns );
    await postScanCleanup();
}

function scanResultsNotFound()  {
    console.log( "Scan failed");
}


//STEP 6 - Post Request Cleanup
//=====================================
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

/**
 * Retrieves URLs to scan from the ad__crossint_1 table
 * @returns String JSON list
 */
async function getUrlsToScan() {
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	const urlListLoc = 'http://localhost/ax_dash_pg/cal/apps/aud/scanpost/getUrlToScan.php';

    let status;
    let urlsRetrieved;

    await fetch( urlListLoc )
        .then( (response) => {
            status = response.status;
            return response.json();
        })
        .then((jsonResponse) => {
            urlsRetrieved = jsonResponse;

            // console.log( JSON.stringify( jsonResponse ) );
            // console.log(status);
        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

    urlsToScan.push( {
        url: urlsRetrieved[0],
        scanned: false
    });
};


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
