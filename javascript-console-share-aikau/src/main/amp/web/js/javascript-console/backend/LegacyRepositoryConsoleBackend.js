/**
 * This module provides the backend service implementation for the "legacy" Repository-tier JavaScript Console.
 * 
 * @module jsconsole/backend/LegacyRepositoryConsoleBackend
 * @extends module:alfresco/services/BaseService
 * @mixes module:alfresco/core/CoreXhr
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define(
        [ 'dojo/_base/declare', 'alfresco/services/BaseService', 'alfresco/core/CoreXhr', 'jsconsole/_ConsoleTopicsMixin',
                'dojo/_base/lang', 'dojo/_base/array', 'service/constants/Default', 'alfresco/util/functionUtils' ],
        function(declare, BaseService, CoreXhr, _ConsoleTopicsMixin, lang, array, Constants, functionUtils)
        {
            return declare(
                    [ BaseService, CoreXhr, _ConsoleTopicsMixin ],
                    {

                        i18nRequirements : [ {
                            i18nFile : './i18n/LegacyRepositoryConsoleBackend.properties'
                        } ],

                        initService : function jsconsole_backend_LegacyRepositoryConsole__initService()
                        {
                            this.inherited(arguments);

                            // generated ID to allow easy differentiation of backend services
                            this.backendId = this.generateUuid();

                            // need to track requests by alfResponseScope
                            this._activeRequestByScope = {};
                        },

                        registerSubscriptions : function jsconsole_backend_LegacyRepositoryConsole__registerSubscriptions()
                        {
                            this.inherited(arguments);

                            this.alfSubscribe(this.discoverBackendsTopic, lang.hitch(this, this.onDiscoverBackendsRequest));
                            this.alfSubscribe(this.executeInBackendTopic, lang.hitch(this, this.onExecuteInBackendRequest));
                        },

                        onDiscoverBackendsRequest : function jsconsole_backend_LegacyRepositoryConsole__onDiscoverBackendsRequest(payload)
                        {
                            // just respond to announce backend to requesting module
                            this.alfPublish((payload.alfResponseTopic || this.discoverBackendsTopic) + '_SUCCESS', {
                                backend : this.backendId,
                                name : 'legacyRepositoryConsole',
                                label : 'jsconsole.backend.LegacyRepositoryConsoleBackend.label',
                                description : 'jsconsole.backend.LegacyRepositoryConsoleBackend.description',
                                supports : [ 'javascriptSource', 'freemarkerSource', 'consoleOutput', 'templateOutput' ]
                            }, false, false, payload.alfResponseScope || '');
                        },

                        onExecuteInBackendRequest : function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendRequest(payload)
                        {
                            var rqData, consoleRequest;
                            if (payload !== undefined && payload !== null)
                            {
                                if (payload.backend === this.backendId)
                                {
                                    rqData = {
                                        script : payload.selectedJavaScriptSource || payload.javaScriptSource || '',
                                        template : payload.freemarkerSource,
                                        resultChannel : this.generateUuid()
                                    };

                                    consoleRequest = {
                                        data : rqData,
                                        alfResponseScope : payload.alfResponseScope,
                                        startTime : new Date()
                                    };

                                    this.serviceXhr({
                                        url : Constants.PROXY_URI + 'de/fme/jsconsole/execute',
                                        data : rqData,
                                        method : 'POST',
                                        successCallback : lang.hitch(this, this.onExecuteInBackendSuccess, consoleRequest),
                                        failureCallback : lang.hitch(this, this.onExecuteInBackendFailure, consoleRequest)
                                    });

                                    consoleRequest.checkTimer = functionUtils.addRepeatingFunction(lang.hitch(this,
                                            this.onExecuteInBackendCheckProgress, consoleRequest), 'MEDIUM');
                                    this._activeRequestByScope[consoleRequest.alfResponseScope] = consoleRequest;
                                }
                                else if (this._activeRequestByScope.hasOwnProperty(payload.alfResponseScope))
                                {
                                    consoleRequest = this._activeRequestByScope[payload.alfResponseScope];
                                    consoleRequest.superseded = true;
                                    consoleRequest.checkTimer.remove();
                                    delete this._activeRequestByScope[consoleRequest.alfResponseScope];
                                }
                            }
                        },

                        onExecuteInBackendSuccess : function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendSuccess(
                                consoleRequest, response)
                        {
                            this.alfLog('info', 'Request succeeded', response, consoleRequest);
                            if (consoleRequest.superseded !== true && consoleRequest.completed !== true)
                            {
                                try
                                {
                                    this.alfPublish(this.resetConsoleOutputTopic, {}, false, false, consoleRequest.alfResponseScope || '');

                                    if (typeof response === 'string')
                                    {
                                        this.alfPublish(this.appendConsoleOutputTopic, {
                                            content : response
                                        }, false, false, consoleRequest.alfResponseScope || '');

                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            content : ''
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }
                                    else
                                    {
                                        if (lang.isArray(response.printOutput))
                                        {
                                            array
                                                    .forEach(
                                                            response.printOutput,
                                                            function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendSuccess_handlePrintOutputLines(
                                                                    line)
                                                            {
                                                                this.alfPublish(this.appendConsoleOutputTopic, {
                                                                    content : line
                                                                }, false, false, consoleRequest.alfResponseScope || '');
                                                            }, this);
                                        }

                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            content : response.renderedTemplate || ''
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }

                                    // this triggers a best-effort last check (in case an error occurred after response was committed to
                                    // stream)
                                    this.onExecuteInBackendCheckProgress(consoleRequest);

                                    // TODO Handle execution stats
                                    // TODO Handle completion state + runLikeCrazy
                                }
                                catch (e)
                                {
                                    this.alfLog('error', 'Encountered error during response handling', response, consoleRequest, e);
                                    consoleRequest.completed = true;
                                    consoleRequest.checkTimer.remove();
                                }
                            }
                        },

                        onExecuteInBackendFailure : function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendFailure(
                                consoleRequest, response)
                        {
                            this.alfLog('error', 'Request failed', response, consoleRequest);
                            if (consoleRequest.superseded !== true && consoleRequest.completed !== true)
                            {
                                if (response.response && response.response.status !== 408 && response.response.data)
                                {
                                    try
                                    {
                                        response = JSON.parse(response.response.data);
                                    }
                                    catch (e)
                                    {
                                        this.alfLog('warn', 'Error parsing error response', response, consoleRequest, e);
                                    }
                                }

                                if ((response.response && response.response.status !== 408)
                                        || (response.status !== undefined && response.status !== 408))
                                {
                                    this.alfPublish(this.resetConsoleOutputTopic, {}, false, false, consoleRequest.alfResponseScope || '');

                                    if (typeof response === 'string')
                                    {
                                        this.alfPublish(this.appendConsoleOutputTopic, {
                                            content : response
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }
                                    else
                                    {
                                        if (lang.isArray(response.printOutput))
                                        {
                                            array
                                                    .forEach(
                                                            response.printOutput,
                                                            function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendCheckProgressSuccess_handlePrintOutputLines(
                                                                    line)
                                                            {
                                                                this.alfPublish(this.appendConsoleOutputTopic, {
                                                                    content : line
                                                                }, false, false, consoleRequest.alfResponseScope || '');
                                                            }, this);
                                        }

                                        if (response.status)
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                content : response.status.code + ' ' + response.status.name
                                            }, false, false, consoleRequest.alfResponseScope || '');

                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                content : response.status.description
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        if (lang.isString(response.message))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                content : response.message
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        if (lang.isString(response.callstack))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                content : '\nStacktrace-Details:'
                                            }, false, false, consoleRequest.alfResponseScope || '');

                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                content : response.callstack
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        // TODO Handle potential error marks from execution error
                                    }

                                    // TODO Handle execution stats
                                    // TODO Handle completion state + runLikeCrazy
                                    consoleRequest.completed = true;
                                    consoleRequest.checkTimer.remove();
                                }
                            }
                        },

                        onExecuteInBackendCheckProgress : function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendCheckProgress(
                                consoleRequest)
                        {
                            if (consoleRequest.superseded !== true && consoleRequest.completed !== true)
                            {
                                // this is a best-effort update - we do not care about failures
                                this.serviceXhr({
                                    url : Constants.PROXY_URI + 'de/fme/jsconsole/' + encodeURIComponent(consoleRequest.data.resultChannel)
                                            + '/executionResult',
                                    method : 'GET',
                                    successCallback : lang.hitch(this, this.onExecuteInBackendCheckProgressSuccess, consoleRequest)
                                });
                            }
                        },

                        onExecuteInBackendCheckProgressSuccess : function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendCheckProgressSuccess(
                                consoleRequest, response)
                        {
                            this.alfLog('info', 'Progress check succeeded', response, consoleRequest);
                            if (consoleRequest.superseded !== true)
                            {
                                this.alfPublish(this.resetConsoleOutputTopic, {}, false, false, consoleRequest.alfResponseScope || '');

                                if (typeof response === 'string')
                                {
                                    this.alfPublish(this.appendConsoleOutputTopic, {
                                        content : response
                                    }, false, false, consoleRequest.alfResponseScope || '');

                                    this.alfPublish(this.updateTemplateOutputTopic, {
                                        content : ''
                                    }, false, false, consoleRequest.alfResponseScope || '');
                                }
                                else
                                {
                                    if (lang.isArray(response.printOutput))
                                    {
                                        array
                                                .forEach(
                                                        response.printOutput,
                                                        function jsconsole_backend_LegacyRepositoryConsole__onExecuteInBackendCheckProgressSuccess_handlePrintOutputLines(
                                                                line)
                                                        {
                                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                                content : line
                                                            }, false, false, consoleRequest.alfResponseScope || '');
                                                        }, this);
                                    }

                                    // if we had an error or entire web script is already done this will be the last update
                                    if (response.error === true || response.error === 'true' || lang.isString(response.webscriptPerf))
                                    {
                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            content : response.renderedTemplate || ''
                                        }, false, false, consoleRequest.alfResponseScope || '');

                                        if (response.error === true || response.error === 'true')
                                        {
                                            // TODO Handle potential error marks from execution error
                                        }

                                        // TODO Handle execution stats
                                        // TODO Handle completion state + runLikeCrazy
                                        consoleRequest.completed = true;
                                        consoleRequest.checkTimer.remove();
                                    }
                                }
                            }
                        }

                    });
        });