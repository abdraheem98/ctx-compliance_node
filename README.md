# <span style="color:darkorange;">CTX Compliance - NodeJS Application  </span>

* <span style="color:darkorange;"></span>Within the root directory of the NodeJS application, the Adtech & Accessibility projects will be separated in standalone directories: <span style="color:dodgerblue;">a11y</span> and <span style="color:dodgerblue;">adtech</span>
    * <span style="color:red;">Exception</span>: if there are common objects/elements for both teams, they will not be separated in the teams' folders. They should be declared as global components in order to be utilized by <span style="color:dodgerblue;">a11y</span> and <span style="color:dodgerblue;">adtech</span> concurrently. Example of a global component: <span style="color:green;">package.json</span> or <span style="color:green;">yml files</span>.
* NodeJS application will be deployed in this current repository, i.e. [CTX_Compliance_Node](https://dev.azure.com/ACC-Azure-06/27111-ADEPTweb/\_git/CTX_Compliance_Node). Before pushing the local changes into the remote repository, the backend code must be separated in <span style="color:dodgerblue;">a11y</span> or <span style="color:dodgerblue;">adtech</span> branch. Once the local <span style="color:dodgerblue;">a11y</span> or <span style="color:dodgerblue;">adtech</span> branch is pushed into the remote repository, then it should be reviewed before it gets merged into the <span style="color:green;">development</span> branch,  <span style="color:red;">but not into the production branch</span><span style="color:red;"></span>. In order to deploy code into the production branch, obviously a QA Tester will be responsible to test out the code changes from the development branch firstly. If the QA Tester approves them, then the development repository can be merged into production.

# <span style="color:darkorange;">**Deployment Process Overview of the**</span><span style="color:darkorange;"> </span><span style="color:darkorange;"> [NodeJS](https://dev.azure.com/ACC-Azure-06/27111-ADEPTweb/\_git/CTX_Compliance_Node) </span><span style="color:darkorange;">**app**</span>

* <span style="color:darkorange;"></span><span style="color:green;">Development Branch</span>: This branch is used for ongoing development and testing of new features and bug fixes. When code changes are committed and pushed to this branch, it triggers the development pipeline.
* <span style="color:green;">Production Branch</span>: This branch represents the stable version of your application that is ready for deployment to the production environment. When code changes are committed and pushed to this branch, it triggers the production pipeline.

<span style="color:green;">**Development Pipeline:**</span>

The development pipeline is responsible for building, testing, and deploying the code changes to the Development App Service. Here are the steps involved:

* Source Trigger: Whenever a code change is pushed to the development branch, it triggers the pipeline to start the deployment process.
* Build: The pipeline starts by fetching the latest code from the development branch and compiles/builds the source code. It may include steps such as restoring dependencies, compiling code, and creating artifacts.
* Test: Once the code is built, the pipeline runs various tests (e.g., unit tests, integration tests, etc.) to ensure the code quality and stability.
* Deploy to Development App Service: If all the tests pass successfully, the pipeline deploys the built artifacts to the Development App Service. This step may involve deploying container images, deploying application packages, or using other deployment mechanisms supported by Azure App Service.

<span style="color:green;">**Production Pipeline:**</span>

The production pipeline is responsible for deploying the code changes from the production branch to the Production App Service. Here's an overview of the process:

* Source Trigger: When a code change is pushed to the production branch, it triggers the pipeline to initiate the deployment process.
* Build: Similar to the development pipeline, the production pipeline fetches the latest code from the production branch and builds the source code.
* Test: The pipeline runs additional tests (e.g., regression tests, performance tests, security tests, etc.) to ensure the stability and quality of the code changes.
* Approval Gate: Before deploying to the Production App Service, it's common to have an approval gate in place. This gate requires manual approval from authorized personnel to proceed with the deployment. It allows the team to review the changes and ensure they are ready for production.
* Deploy to Production App Service: Once the approval is obtained, the pipeline deploys the built artifacts to the Production App Service. This step ensures the latest changes are made available to the live production environment.

<span style="color:green;">**Continuous Integration and Deployment (CI/CD):**</span>

* To automate the deployment processes further, it has been configured continuous integration and deployment in Azure DevOps. This setup enabled automatic triggering of the pipelines whenever code changes are pushed to the respective branches. It streamlines the development and deployment workflow, reducing manual effort and ensuring faster and more reliable deployments.