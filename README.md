# Continuum using JavaScript, Node, Cucumber.js, Selenium, and Chrome

This is a sample Continuum 5.0.1 project that tests www.irs.gov for accessibility concerns using JavaScript, specifically Node, [Cucumber.js](https://github.com/cucumber/cucumber-js), and Selenium using the Google Chrome web driver.

You can have this sample project test different URLs by modifying the `features/a11y.feature` file, adding/editing/removing URLs from the `Examples` list.

## Prerequisites
* Node
* Google Chrome

## Installation
1. Install dependencies:

        npm install

## Usage
1. Run accessibility tests:

        npm test
        
Note that if you encounter an error like the following:

    SessionNotCreatedError: session not created: This version of ChromeDriver only supports Chrome version 80

It means you need to update the `chromedriver` package in your package.json file for the version of Chrome you have installed.
See [this package's documentation](https://www.npmjs.com/package/chromedriver) for more information.

## Support
Rich API documentation for all the functionality supported out of the box with our Continuum JavaScript SDK, which this sample project uses, can be found [here](https://tools.levelaccess.net/continuum/docs/latest/jsdoc/index.html).

Questions can be emailed to Level Access support at support@levelaccess.com.

