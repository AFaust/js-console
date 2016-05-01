
Javascript Console Admin Console component for Alfresco Share (Aikau-variant)
=============================================================================

Author: Axel Faust

This project defines a Javascript Console component for Share's Administration Console,
which enables the execution of arbitrary JavaScript code in the Repository / Share web
script, Repository action or Share page layers, including FreeMaker template evaluation
where applicable. The console tool added by this project uses Aikau as the foundation.


Installation
------------

The component has been developed to install on top of an existing Alfresco
5.x installation. The javascript-console-share-aikau-<version>.amp needs
to be installed into the Alfresco Share webapp using the Alfresco Module Management Tool:

    java -jar alfresco-mmt.jar install javascript-console-share-aikau-<version>.amp /path/to/share.war
  
You can also use the Alfresco Maven SDK to install or overlay the AMP during the build of a
Share WAR project. See https://artifacts.alfresco.com/nexus/content/repositories/alfresco-docs/alfresco-lifecycle-aggregator/latest/plugins/alfresco-maven-plugin/advanced-usage.html
for details.

Building
--------

To build the module and its AMP / JAR files, run the following command from the base 
project directory:

    mvn install

The command builds two JAR files named javascript-console-share-<version>.jar and
javascript-console-share-<version>-sources.jar as well as javascript-console-share-<version>.amp
in the 'target' directory within your project.

To hotdeploy to a local alfresco installation you can use the alfresco:install
command to deploy the Javascript Console directly to a WAR file or an exploded war folder:

    mvn package alfresco:install -Dmaven.alfresco.warLocation=/path/to/tomcat/webapps/share.war

Using the component
-------------------

Log in to Alfresco Share as an admin user and navigate to the Administration
page. Click 'Javascript Console' in the left hand side navigation.