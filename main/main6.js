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

//Should contain all data for the active scan in progress
let ctxScanApp = {};

//Contains the source data objects used for completing scans. This is the entire list of 
//objects to scan.
ctxScanApp.urlsToScan = [];

//The current source data object to scan
ctxScanApp.currentScanSrc = {};

const MSG_TYPE_ERROR = "msg_type_error";
const MSG_TYPE_FINISH = "msg_type_finish";
const MSG_TYPE_START = "msg_type_start";
const MSG_TYPE_UPDATE = "msg_type_update";


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

    const scanListLen = ctxScanApp.urlsToScan.length;
    console.log( `runScan_start(): Scanning ${scanListLen} pages` );
    

    for (let i=0; i<scanListLen; i++) {
        ctxScanApp.currentScanSrc = ctxScanApp.urlsToScan[i];
        console.log( "now scanning: ", ctxScanApp.currentScanSrc.url );
        ctxScanApp.currentScanSrc.scanned = true;
        await driver.get( ctxScanApp.currentScanSrc.url ).then(runScan_postInitialize, runScan_start_failed);
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

    //run the format test here - if it fails, branch the promise
    
    
    if ( ctxScanApp.currentScanSrc.is_global == "f" ) {
        
        //do a simple scan
        await getFullPageScanResults().then(scanResultsFound, scanResultsNotFound);

    } else if ( ctxScanApp.currentScanSrc.is_global == "t" && ctxScanApp.currentScanSrc.node_path == null ) {
        //error - this is a global component, but the node_path is missing
        //This should be noted, but it should not break the chain of scanning
        throw( `getScanResults(): Source id ${ ctxScanApp.currentScanSrc.id } is set to global, but does not have a node_path value.` )
        
    } else if ( ctxScanApp.currentScanSrc.is_global == "t" && ctxScanApp.currentScanSrc.node_path !== null ) {
        
        //node scan
        console.log("runScan_getResults(): Running a node scan" );
        await getNodeScanResults().then(scanResultsFound, scanResultsNotFound);
    }
    
}

async function getFullPageScanResults() {

    await Continuum.runAllTests();

}    


async function getNodeScanResults() {

    await Continuum.runAllTestsOnNode( ctxScanApp.currentScanSrc.node_path );

}


async function runScan_postInit_failed( error ) {
    console.log( "runScan_postInit_failed. error: ", error );
}

//STEP 5 - Run scans
//=====================================

async function scanResultsFound() {
    let accessibilityConcerns = await Continuum.getAccessibilityConcerns();
    console

    //move the fingerprint object into the main object so it can be converted to JSON
    issLen = accessibilityConcerns.length;
    for ( let i=0; i<issLen; i++ ) {
        accessibilityConcerns[i]._fingerprint = accessibilityConcerns[i]._rawEngineJsonObject.fingerprint
    }

    //console.log("scanResultsFound(): Scan results: ", accessibilityConcerns);
    console.log("scanResultsFound(): Scan results length: ", accessibilityConcerns.length);    
    //console.log("scanResultsFound(): Scan results: ", accessibilityConcerns[0]);    
    //await sendAccessibilityConcernsToCTXAx( accessibilityConcerns );
    await postScanCleanup();
}

function scanResultsNotFound( error )  {
    console.log( "scanResultsNotFound(): ", error );
}


//STEP 6 - Post Request Cleanup
//=====================================
let postScanCleanup = () => {
    const scanListLen = ctxScanApp.urlsToScan.length;
    let allUrlsScanned = true;

    for (let i=0; i<scanListLen; i++) {
        if ( !ctxScanApp.urlsToScan[i].scanned ) {
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

            /*
            console.log( "getUrlsToScan(): Status:", status);
            console.log( "getUrlsToScan(): Length:", urlsRetrieved.length);
            console.log( "getUrlsToScan(): Type:", typeof urlsRetrieved );
            //console.log( "getUrlsToScan(): Url data:", JSON.stringify( jsonResponse ) );
            
            //Summarize globals
            let globalItems = [];
            for (let y=0; y < urlsRetrieved.length; y++) {
                if (urlsRetrieved[y].is_global == "t") globalItems.push( urlsRetrieved[y] );
            }
            console.log( "getUrlsToScan(): globals:", globalItems );
            */

            //strip out a single global component for scanning
            for (let y=0; y < urlsRetrieved.length; y++) {
                 urlsRetrieved[y].scanned = false;
                 
                 if (urlsRetrieved[y].is_global == "t") {
                    ctxScanApp.urlsToScan.push( urlsRetrieved[y] );
                }
            }
            //console.log( "getUrlsToScan(): Url data:", urlsRetrieved );
        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

};


/**
 * Retrieves URLs to scan from the ad__crossint_1 table
 * @returns String JSON list
 */
async function postScanLogEntry( msg, type, scanid = -1, timestamp = Date.now() ) {
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	const targetPg = 'http://localhost/ax_dash_pg/cal/apps/aud/scanpost/postScanLogEntry.php';

    let status;
    let scanId;

    letScanLogMsg = {
        "msg": msg,
        "type": type,
        "scanid" : scanid,
        "timestamp": timestamp
    }

    await fetch( urlListLoc, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: scanLogMsg
    })
        .then( (response) => {
            status = response.status;
            return response.json();
        })
        .then((jsonResponse) => {
            scanId = jsonResponse;
            // console.log( JSON.stringify( jsonResponse ) );
            // console.log(status);
        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

    //if successful, store the scan id for later use.
    //if error, kill the whole process so it can be resolved

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
