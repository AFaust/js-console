/**
 * This module defines the common pubSub topics that will be used within the JavaScript Console addon.
 * 
 * @module jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define([ 'dojo/_base/declare' ], function(declare)
{
    return declare([], {

        toggleActiveBackendTopic : 'JS_CONSOLE_TOGGLE_ACTIVE_BACKEND',
        
        javaScriptTypeDefinitionsLoadedTopic : 'JS_CONSOLE_JS_TYPE_DEFINITIONS_LOADED',

        updateJavaScriptSourceTopic : 'JS_CONSOLE_UPDATE_JS_SOURCE',

        javaScriptSourceUpdatedTopic : 'JS_CONSOLE_JS_SOURCE_UPDATED',

        updateFreemarkerSourceTopic : 'JS_CONSOLE_UPDATE_FTL_SOURCE',

        freemarkerSourceUpdatedTopic : 'JS_CONSOLE_FTL_SOURCE_UPDATED',

        updateTemplateOutputTopic : 'JS_CONSOLE_UPDATE_TEMPLATE_OUTPUT',
        
        reportExecutionPerformanceTopic : 'JS_CONSOLE_REPORT_EXECUTION_PERFORMANCE',

        appendConsoleOutputTopic : 'JS_CONSOLE_APPEND_CONSOLE_OUTPUT',

        resetConsoleOutputTopic : 'JS_CONSOLE_RESET_CONSOLE_OUTPUT',
        
        discoverBackendsTopic : 'JS_CONSOLE_DISCOVER_BACKENDS',
        
        executeInBackendTopic : 'JS_CONSOLE_EXECUTE_IN_BACKEND'

    });
});