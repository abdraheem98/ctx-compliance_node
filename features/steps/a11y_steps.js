const {Given, Then, When} = require('cucumber');
const expect = require('chai').expect;

const {Continuum, ReportManagementStrategy, ModuleManagementStrategy} = require('@continuum/continuum-javascript-professional');

Given('the web page {string} is displayed', async function (url) {
	await this.driver.get(url);
});

Given('Continuum is initialized', async function () {
	await Continuum.setUp(this.driver, require('path').resolve(__dirname, "../support/continuum.conf.js"), null);
});

When('I use Continuum to scan for accessibility concerns', async function () {
	await Continuum.runAllTests();
});

Then('no accessibility issues should be found', async function () {
	const accessibilityConcerns = Continuum.getAccessibilityConcerns();

	try {
		expect(accessibilityConcerns.length).to.be.equal(0);
	} finally {
		console.log(`${accessibilityConcerns.length} accessibility concern(s) found:`);
		console.log(JSON.stringify(accessibilityConcerns, null, 2));

		// to send these accessibility concerns from Continuum to AMP, uncomment the line below and
		// edit the submitAccessibilityConcernsToAMP function according to our 'Sending Continuum Testing Results to AMP' support article:
		// https://support.levelaccess.com/hc/en-us/articles/360024510632-Sending-Continuum-Testing-Results-to-AMP
		//await submitAccessibilityConcernsToAMP(this.driver, accessibilityConcerns);
		// to send them to Elevin, uncomment the line below
		// await submitAccessibilityConcernsToElevin(this.driver, accessibilityConcerns);
	}
});

async function submitAccessibilityConcernsToAMP(driver, accessibilityConcerns) {
	console.log();
	console.log("Submitting accessibility concerns to AMP...");

	const ampReportingService = Continuum.AMPReportingService;

	await ampReportingService.setActiveOrganization(12345);  // ID of AMP organization to submit test results to
	await ampReportingService.setActiveAsset(54321);  // ID of AMP asset to submit test results to
	await ampReportingService.setActiveReportByName("Example Report");
	await ampReportingService.setActiveModuleByName(await driver.getTitle(), await driver.getCurrentUrl());
	await ampReportingService.setActiveReportManagementStrategy(ReportManagementStrategy.APPEND);
	await ampReportingService.setActiveModuleManagementStrategy(ModuleManagementStrategy.OVERWRITE);
	await ampReportingService.submitAccessibilityConcernsToAMP(accessibilityConcerns);

	console.log(`Accessibility concerns submitted to AMP: ${ampReportingService.activeModule.getAMPUrl()}`);
	console.log();
}

async function submitAccessibilityConcernsToElevin(driver, accessibilityConcerns) {
    console.log('Beginning Elevin scan...');

    const ElevinReportingService = Continuum.ElevinReportingService;
    await ElevinReportingService.beginScan();
    console.log('Elevin scan has begun');
    console.log('Submitting accessibilityConcerns to Elevin...');
    await ElevinReportingService.submit(accessibilityConcerns);
    console.log('AccessibilityConcerns are submitted to Elevin');
    console.log('Completing Elevin scan...');
    await ElevinReportingService.completeScan();
    console.log('Elevin scan is completed.')
}