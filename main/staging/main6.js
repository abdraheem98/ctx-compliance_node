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

//The scan log id identifies the active scan record where log entries
//are posted. Initially, the value is -1, and it is updated by the first
//log post to a valid scan id.
ctxScanApp.scanLogId = -1;

//The current source data object to scan
ctxScanApp.currentScanSrc = {};

/*
When true, the scan metadata - as opposed to the individual
page metadata - has been updated.
*/
ctxScanApp.currentScanSrc.scanMetadataPosted = false;

ctxScanApp.currentScanSrc.metadata = [];


const MSG_TYPE_ERROR = "msg_type_error";
const MSG_TYPE_FINISH = "msg_type_finish";
const MSG_TYPE_START = "msg_type_start";
const MSG_TYPE_UPDATE = "msg_type_update";

/*
* STEP 1 - Get Urls
* As a first step, retrieve URLs, or determine that none are available. Create an initial scan record
* initially, even if the URL list is not available, so record can be made of it.
* ===============================================================================
*/

try {
    
    getUrls_start();

} catch( error ) {

    console.log("An error occurred: ", error);
    
}

async function getUrls_start() {

    //Post the initial scan record
    //The scan log id is expected to be -1 at this point.
    await postScanRecord(`Starting scan. Retrieving URLs from scan list.`, MSG_TYPE_START, ctxScanApp.scanLogId, -1);
    
    //Now that the initial scan record is created, retrieve URLs for scanning
    await( getUrlsToScan() ).then( runScan_start, getUrls_failed );
    
};

async function getUrls_failed() {
    
    console.log("URL Retrieval failed");
    postScanRecord(`Aborted scan with no pages completed. Unable to retrieve URLs from scan list.`, MSG_TYPE_UPDATE, ctxScanApp.scanLogId, -1);

    let forceCleanup = true;
    postScanCleanup( forceCleanup );
};

//STEP 2 - Start scan run
//=====================================

async function runScan_start() {

    const scanListLen = ctxScanApp.urlsToScan.length;

    if ( scanListLen > 0 ) {

        //Start a scan record
        postScanRecord( `Beginning scan with ${scanListLen} sources.`, MSG_TYPE_UPDATE, ctxScanApp.scanLogId );
        console.log( `runScan_start(): Scanning ${scanListLen} pages` );
    
        //Execute on scans
        for (let i=0; i<scanListLen; i++) {
            ctxScanApp.currentScanSrc = ctxScanApp.urlsToScan[i];
            console.log( "now scanning: ", ctxScanApp.currentScanSrc.url );
            ctxScanApp.currentScanSrc.scanned = true;
            await driver.get( ctxScanApp.currentScanSrc.url ).then( runScan_postInitialize, runScan_start_failed );
        };

    } else {
        
        //Nothing to scan
        postScanRecord(`Aborted scan - no pages to scan.`, MSG_TYPE_ERROR, ctxScanApp.scanLogId);

        let forceCleanup = true;
        postScanCleanup( forceCleanup );
    }    

}


async function runScan_start_failed() {

    console.log( "runScan_start_failed" );
    postScanRecord(`Scan aborted - an error occurred starting up the scan for this source.`, MSG_TYPE_ERROR, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);

}

//STEP 3 - Set Up Continuum
//=====================================

async function runScan_postInitialize() {
    
    //await setContinuum();
    await Continuum.setUp(driver, require('path').resolve(__dirname, "./continuum.conf.js"), null).then(runScan_getResults,runScan_postInit_failed);
    
}

async function runScan_postInit_failed( error ) {
    
    console.log( "runScan_postInit_failed. error: ", error );
    postScanRecord(`Scan aborted - could not set Chrome driver to this source.`, MSG_TYPE_ERROR, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);
}


//STEP 4 - Request scan results
//=====================================

async function runScan_getResults() {

    //run the format test here - if it fails, branch the promise
    
    
    if ( ctxScanApp.currentScanSrc.is_global == "f" ) {
        
        //do a simple scan
        
        //await getFullPageScanResults().then(scanResultsFound, scanResultsNotFound);
        await getFullPageScanResults().then(getPageMetadata_fullPage, scanResultsNotFound);

    } else if ( ctxScanApp.currentScanSrc.is_global == "t" && ctxScanApp.currentScanSrc.node_path == null ) {
        //error - this is a global component, but the node_path is missing
        //This should be noted, but it should not break the chain of scanning
        
        postScanRecord(`Found a global component with no node_path, can't complete scan of this source.`, MSG_TYPE_ERROR, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);
        //throw( `getScanResults(): Source id ${ ctxScanApp.currentScanSrc.scan_list_id} is set to global, but does not have a node_path value.` )
        
    } else if ( ctxScanApp.currentScanSrc.is_global == "t" && ctxScanApp.currentScanSrc.node_path !== null ) {
        
        //node scan
        //console.log("runScan_getResults(): Running a node scan" );
        
        //await getNodeScanResults().then(scanResultsFound, scanResultsNotFound);
        await getNodeScanResults().then(getPageMetadata_pageNode, scanResultsNotFound);
    }
    
}

async function getFullPageScanResults() {

    await Continuum.runAllTests();

}    


async function getNodeScanResults() {

    await Continuum.runAllTestsOnNode( ctxScanApp.currentScanSrc.node_path );

}

//Step 5a - Get Page Metadata
//====================================

async function getPageMetadata_fullPage() {
    
    let pageMetadata = await Continuum.getPageMetadata();
    await postScanMetadata( ctxScanApp.scanLogId, pageMetadata, ctxScanApp.currentScanSrc.scan_list_id ).then( scanResultsFound, scanResultsNotFound );

}

async function getPageMetadata_pageNode() {
    
    let pageMetadata = await Continuum.getPageMetadata();
    await postScanMetadata( ctxScanApp.scanLogId, pageMetadata, ctxScanApp.currentScanSrc.scan_list_id ).then( scanResultsFound, scanResultsNotFound );

}


//STEP 5 - Run scans
//=====================================

async function scanResultsFound() {

    let accessibilityConcerns = await Continuum.getAccessibilityConcerns();
    let issLen = accessibilityConcerns.length;

    if ( issLen > 0 ) {

        postScanRecord(`Scan found ${issLen} issues.`, MSG_TYPE_UPDATE, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);
        
        //move the fingerprint object into the main object so it can be converted to JSON
        for ( let i=0; i<issLen; i++ ) {
            accessibilityConcerns[i]._fingerprint = accessibilityConcerns[i]._rawEngineJsonObject.fingerprint
        }

    } else {
        
        postScanRecord(`Scan found 0 issues.`, MSG_TYPE_UPDATE, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);
        
    }

    //console.log("scanResultsFound(): Scan results: ", accessibilityConcerns);
    console.log("scanResultsFound(): Scan results length: ", accessibilityConcerns.length);    
    //console.log("scanResultsFound(): Scan results: ", accessibilityConcerns[0]);    
    //await sendAccessibilityConcernsToCTXAx( accessibilityConcerns );
    await postScanCleanup();
}

function scanResultsNotFound( error )  {
    console.log( "scanResultsNotFound(): ", error );
    postScanRecord(`Could not retrieve accessibility concerns for this source.`, MSG_TYPE_ERROR, ctxScanApp.scanLogId, ctxScanApp.currentScanSrc.scan_list_id);
}


//STEP 6 - Post Request Cleanup
//=====================================

/**
 * Performs cleanup after checking that all scanning is complete. There is a way to 
 * force closure regardless of status by setting force_close to true.
 * 
 * @param {*} force_close 
 */
let postScanCleanup = ( force_close = false ) => {

    if ( !force_close ) {

        const scanListLen = ctxScanApp.urlsToScan.length;
        let allUrlsScanned = true;

        for (let i=0; i<scanListLen; i++) {
            if ( !ctxScanApp.urlsToScan[i].scanned ) {
                allUrlsScanned = false;
                break;
            }
        };

        if ( allUrlsScanned ) {
            postScanRecord(`Full scan completed.`, MSG_TYPE_FINISH, ctxScanApp.scanLogId);
            driver.quit();
        }

    } else {

        postScanRecord(`Closing aborted scan`, MSG_TYPE_FINISH, ctxScanApp.scanLogId);
        if (driver) driver.quit();

    }
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
            
            //console.log( "getUrlsToScan(): Url data:", JSON.stringify( jsonResponse ) );

            /*
            //Get info
            console.log( "getUrlsToScan(): Status:", status);
            console.log( "getUrlsToScan(): Length:", jsonResponse.length);
            console.log( "getUrlsToScan(): Type:", typeof 8jsonResponse );
            //console.log( "getUrlsToScan(): Url data:", JSON.stringify( jsonResponse ) );
            
            //Summarize globals
            let globalItems = [];
            for (let y=0; y < jsonResponse.length; y++) {
                if (jsonResponse[y].is_global == "t") globalItems.push( jsonResponse[y] );
            }
            console.log( "getUrlsToScan(): globals:", globalItems );
            */

            //strip out global components for scanning
            /*
            for (let y=0; y < jsonResponse.length; y++) {
                jsonResponse[y].scanned = false;
                 
                 if (jsonResponse[y].is_global == "t") {
                    ctxScanApp.urlsToScan.push( jsonResponse[y] );
                }
            }
            */

            for (let y=0; y < jsonResponse.length; y++) {

                jsonResponse[y].scanned = false;                 
                ctxScanApp.urlsToScan.push( jsonResponse[y] );
                break;

            }

        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

};

/**
 * Post a scan record
 * @param {*} msg The message to be sent
 * @param {*} type The type of record to be sent - uses constants starting with "MSG_TYPE"
 * @param {*} scanid The id from the 'jtm_scans' entry, or -1 if it has not yet been established
 * @param {*} scan_list_id The id from the 'jtm_scan-list' table. This is optional since the record might not pertain to a specific jtm-scan-list id element.
 * @param {*} timestamp The timestamp for the record. It is rare to provide anything here - the function will provide the current time down to the seconds.
 */
async function postScanRecord( msg, type, scanid = ctxScanApp.scanLogId, scan_list_id = -1, timestamp = new Date() ) {
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	const targetPg = 'http://localhost/ax_dash_pg/cal/apps/aud/scanpost/postScanRecord.php';

    let scanLogMsg = {
        "msg": msg,
        "type": type,
        "scanid" : scanid,
        "scanlistid" : scan_list_id,
        "timestamp": getFullDateAndTime()
    }

    let status;

    await fetch( targetPg, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanLogMsg)
    })
        .then( (response) => {
            status = response.status;
            return response.json();
        })
        .then((jsonResponse) => {
            //console.log( "postScanRecord(): status: ", status);
            //console.log( "postScanRecord(): jsonResponse: ", jsonResponse );

            if ( 'new_scan_id' in jsonResponse ) {
                ctxScanApp.scanLogId = jsonResponse.new_scan_id;                
            }
        })
        .catch((err) => {
            // handle error
            console.error(err);
        });

};


/**
 * Post both the page metadata, and the individual page metadata since
 * they are retrieved as a single set of data.
 * 
 * @param {*} scanid This is expected to be a non-negative integer
 * @param {*} metaDataObj Metadata in object format
 * @param {*} scanListId The id of the element in the jtm-scan-list that is currently being scanned
 */
async function postScanMetadata( scanid = ctxScanApp.scanLogId, metaDataObj, scanListId ) {

    console.log( "postScanMetadata(): scanListId =", scanListId );
    
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
	const targetPg = 'http://localhost/ax_dash_pg/cal/apps/aud/scanpost/addMetadataToScan.php';

    let metadataToAdd = {
        "scanid": scanid,
        "scanListId": scanListId,
        "recordType": MSG_TYPE_UPDATE,
        "browserWindowHeight": metaDataObj.height,
        "browserWindowWidth": metaDataObj.width,
        "redirectedUrl": encodeURI(metaDataObj.redirectedUrl),
        "docHeight": metaDataObj.docHeight,
        "docWidth": metaDataObj.docWidth,
        "docTitle": encodeURI(metaDataObj.title),
        "orientation" : metaDataObj.orientation,
        "userAgent" : metaDataObj.userAgent
    }

    console.log( "metadata", metaDataObj );

    let status;

    await fetch( targetPg, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadataToAdd)
    })
        .then( (response) => {
            status = response.status;
            return response.json();
        })
        .then((jsonResponse) => {
            console.log( "postScanMetadata(): status: ", status);
            console.log( "postScanMetadata(): jsonResponse: ", jsonResponse );
            //update ctxScanApp.currentScanSrc.scanMetadataPosted
        })
        .catch((err) => {
            // handle error
            console.error(err);
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

function getFullDateAndTime( timestamp = new Date(), forceTwoDigits = true ) {
    
    //month
    let timeMonth = timestamp.getMonth();
    timeMonth++;
    timeMonth = timeMonth.toString();
    if ( forceTwoDigits && timeMonth.length == 1 )  timeMonth = "0" + timeMonth;

    //day
    let timeDay = timestamp.getDate();
    timeDay = timeDay.toString();
    if ( forceTwoDigits && timeDay.length == 1 ) timeDay = "0" + timeDay;

    //year
    let timeYear = timestamp.getFullYear();
    timeYear = timeYear.toString();
    if ( forceTwoDigits ) timeYear = timeYear.substring(2);
    
    //hours
    let timeHour = timestamp.getHours();
    timeHour = timeHour.toString();
    
    //minutes
    let timeMinutes = timestamp.getMinutes();
    timeMinutes = timeMinutes.toString();
    
    //seconds
    let timeSeconds = timestamp.getSeconds();
    timeSeconds = timeSeconds.toString();
    
    //console.log( "dcaapJsUtils.getFullDateAndTime(): Month:", timeMonth, ", Day:",timeDay, ", Year:", timeYear, ", Hours:", timeHour, "Minutes:", timeMinutes, "Seconds:", timeSeconds );

    return {
        month: timeMonth,
        day: timeDay,
        year: timeYear,
        hour: timeHour,
        minute: timeMinutes,
        second: timeSeconds
    };

};
