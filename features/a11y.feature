Feature: Test a web page for accessibility

    Scenario Outline: Run all automated accessibility tests on the specified web page in the page load state
        Given the web page "<url>" is displayed
        And Continuum is initialized
        When I use Continuum to scan for accessibility concerns
        Then no accessibility issues should be found
        Examples:
            |url|
            |https://www.nps.gov/|
            |https://www.nps.gov/aboutus/index.htm|
