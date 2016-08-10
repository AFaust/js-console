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

                        cssRequirements : [ {
                            cssFile : './css/LegacyRepositoryConsoleBackend.css'
                        } ],

                        i18nRequirements : [ {
                            i18nFile : './i18n/CommonBackend.properties'
                        }, {
                            i18nFile : './i18n/LegacyRepositoryConsoleBackend.properties'
                        } ],

                        widgetsForExecutionParameterForm : [ {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-DOCUMENT',
                            name : 'alfresco/forms/controls/DocumentPicker',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-document',
                                name : 'executionParameter.document',
                                label : 'jsconsole.backend.repository.parameters.document.label',
                                description : 'jsconsole.backend.repository.parameters.document.description',
                                value : ''
                            }
                        }, {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-SPACE',
                            name : 'alfresco/forms/controls/ContainerPicker',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-space',
                                name : 'executionParameter.space',
                                label : 'jsconsole.backend.repository.parameters.space.label',
                                description : 'jsconsole.backend.repository.parameters.space.description',
                                value : ''
                            }
                        }, {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-URL_ARGUMENTS',
                            name : 'alfresco/forms/controls/TextBox',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-urlArguments',
                                name : 'executionParameter.urlArguments',
                                label : 'jsconsole.backend.webscript.parameters.urlArguments.label',
                                description : 'jsconsole.backend.webscript.parameters.urlArguments.description',
                                value : ''
                            }
                        }, {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-RUN_AS',
                            name : 'alfresco/forms/controls/TextBox',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-runAs',
                                name : 'executionParameter.runAs',
                                label : 'jsconsole.backend.parameters.runAs.label',
                                description : 'jsconsole.backend.parameters.runAs.description',
                                value : 'admin'
                            }
                        }, {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-ISOLATION',
                            name : 'alfresco/forms/controls/Select',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-isolation',
                                name : 'executionParameter.isolation',
                                label : 'jsconsole.backend.repository.parameters.isolation.label',
                                description : 'jsconsole.backend.repository.parameters.isolation.description',
                                optionsConfig : {
                                    fixed : [ {
                                        label : 'jsconsole.backend.repository.parameters.isolation.none.label',
                                        value : 'none'
                                    }, {
                                        label : 'jsconsole.backend.repository.parameters.isolation.readOnly.label',
                                        value : 'readonly'
                                    }, {
                                        label : 'jsconsole.backend.repository.parameters.isolation.readWrite.label',
                                        value : 'readwrite'
                                    } ]
                                },
                                value : 'readwrite'
                            }
                        }, {
                            id : 'LEGACY_REPOSITORY_CONSOLE_BACKEND-RUN_LIKE_CRAZY',
                            name : 'alfresco/forms/controls/Select',
                            config : {
                                additionalCssClasses : 'fixedWidth parameters-runLikeCrazy',
                                name : 'executionParameter.runLikeCrazy',
                                label : 'jsconsole.backend.parameters.runLikeCrazy.label',
                                description : 'jsconsole.backend.parameters.runLikeCrazy.description',
                                optionsConfig : {
                                    fixed : [ {
                                        label : 'jsconsole.backend.parameters.runLikeCrazy.off.label',
                                        value : '-1'
                                    }, {
                                        label : 'jsconsole.backend.parameters.runLikeCrazy.tenS.label',
                                        value : '10000'
                                    }, {
                                        label : 'jsconsole.backend.parameters.runLikeCrazy.oneS.label',
                                        value : '1000'
                                    }, {
                                        label : 'jsconsole.backend.parameters.runLikeCrazy.zero.label',
                                        value : '0'
                                    } ]
                                },
                                value : '-1'
                            }
                        } ],

                        backendId : 'legacyRepositoryConsole',

                        initService : function jsconsole_backend_LegacyRepositoryConsoleBackend__initService()
                        {
                            this.inherited(arguments);

                            // need to track requests by alfResponseScope
                            this._activeRequestByScope = {};
                        },

                        registerSubscriptions : function jsconsole_backend_LegacyRepositoryConsoleBackend__registerSubscriptions()
                        {
                            this.inherited(arguments);

                            this.alfSubscribe(this.discoverBackendsTopic, lang.hitch(this, this.onDiscoverBackendsRequest));
                            this.alfSubscribe(this.executeInBackendTopic, lang.hitch(this, this.onExecuteInBackendRequest));
                        },

                        onDiscoverBackendsRequest : function jsconsole_backend_LegacyRepositoryConsoleBackend__onDiscoverBackendsRequest(
                                payload)
                        {
                            // just respond to announce backend to requesting module
                            this.alfPublish((payload.alfResponseTopic || this.discoverBackendsTopic) + '_SUCCESS',
                                    {
                                        backend : this.backendId,
                                        name : 'legacyRepositoryConsole',
                                        label : 'jsconsole.backend.LegacyRepositoryConsoleBackend.label',
                                        description : 'jsconsole.backend.LegacyRepositoryConsoleBackend.description',
                                        isDefault : true,
                                        supports : [ 'javascriptSource', 'freemarkerSource', 'consoleOutput', 'templateOutput',
                                                'performanceReport' ],
                                        executionParameterFormWidgets : lang.clone(this.widgetsForExecutionParameterForm)
                                    }, false, false, payload.alfResponseScope || '');

                            this.serviceXhr({
                                url : window.location.protocol + "//" + window.location.host + Constants.URL_SERVICECONTEXT
                                        + 'javascript-console/type-definitions/index',
                                method : 'GET',
                                successCallback : lang.hitch(this, this.onLoadTypeDefinitionsSuccess, payload)
                            });
                        },

                        onLoadTypeDefinitionsSuccess : function jsconsole_backend_LegacyRepositoryConsoleBackend__onLoadTypeDefinitionsSuccess(
                                originalPayload, response)
                        {
                            if (lang.exists('!name', response))
                            {
                                // response is a single type definition
                                this.alfPublish(this.javaScriptTypeDefinitionsLoadedTopic, {
                                    backend : this.backendId,
                                    additive : true,
                                    javaScriptTypeDefinitions : [ response ]
                                }, false, false, originalPayload.alfResponseScope || '');
                            }
                            else
                            {
                                if (response.hasOwnProperty('typeDefinitions') && lang.isArray(response['typeDefinitions']))
                                {
                                    this.alfPublish(this.javaScriptTypeDefinitionsLoadedTopic, {
                                        backend : this.backendId,
                                        additive : true,
                                        javaScriptTypeDefinitions : response['typeDefinitions']
                                    }, false, false, originalPayload.alfResponseScope || '');
                                }

                                if (response.hasOwnProperty('typeDefinitionUrls') && lang.isArray(response['typeDefinitionUrls']))
                                {
                                    array
                                            .forEach(
                                                    response['typeDefinitionUrls'],
                                                    function jsconsole_backend_LegacyRepositoryConsoleBackend__onLoadTypeDefinitionsSuccess_loadEachUrl(
                                                            url)
                                                    {
                                                        if (lang.isString(url))
                                                        {
                                                            this.serviceXhr({
                                                                url : url,
                                                                method : 'GET',
                                                                successCallback : lang.hitch(this, this.onLoadTypeDefinitionsSuccess,
                                                                        originalPayload)
                                                            });
                                                        }
                                                    }, this);
                                }
                            }
                        },

                        onExecuteInBackendRequest : function jsconsole_backend_LegacyRepositoryConsoleBackend__onExecuteInBackendRequest(
                                payload)
                        {
                            var rqData, consoleRequest;
                            if (payload !== undefined && payload !== null)
                            {
                                if (payload.backend === this.backendId)
                                {
                                    rqData = {
                                        script : payload.selectedJavaScriptSource || payload.javaScriptSource || '',
                                        template : payload.freemarkerSource,
                                        resultChannel : this.generateUuid(),
                                        transaction : lang.getObject('executionParameter.isolation', false, payload) || 'readwrite',
                                        runas : lang.getObject('executionParameter.runAs', false, payload) || Constants.USERNAME,
                                        urlargs : lang.getObject('executionParameter.urlArguments', false, payload) || ''
                                    };

                                    consoleRequest = {
                                        data : rqData,
                                        alfResponseScope : payload.alfResponseScope,
                                        startTime : new Date(),
                                        runLikeCrazy : parseInt(lang.getObject('executionParameter.runLikeCrazy', false, payload) || '-1',
                                                10)
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

                        onExecuteInBackendSuccess : function jsconsole_backend_LegacyRepositoryConsoleBackend__onExecuteInBackendSuccess(
                                consoleRequest, response)
                        {
                            this.alfLog('info', 'Request succeeded', response, consoleRequest);
                            consoleRequest.endTime = consoleRequest.endTime || new Date();

                            if (consoleRequest.superseded !== true && consoleRequest.completed !== true)
                            {
                                try
                                {
                                    this.alfPublish(this.resetConsoleOutputTopic, {
                                        backend : this.backendId
                                    }, false, false, consoleRequest.alfResponseScope || '');

                                    if (typeof response === 'string')
                                    {
                                        this.alfPublish(this.appendConsoleOutputTopic, {
                                            backend : this.backendId,
                                            content : response
                                        }, false, false, consoleRequest.alfResponseScope || '');

                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            backend : this.backendId,
                                            content : ''
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }
                                    else
                                    {
                                        if (lang.isArray(response.printOutput))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.printOutput.join('\n')
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            backend : this.backendId,
                                            content : response.renderedTemplate || ''
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }

                                    // this triggers a best-effort last check (in case an error occurred after response was committed to
                                    // stream)
                                    this.onExecuteInBackendCheckProgress(consoleRequest);

                                    this._processExecutionStatistics(consoleRequest, response);
                                    this._runRequestLikeCrazy(consoleRequest);
                                    consoleRequest.completed = true;
                                    consoleRequest.checkTimer.remove();
                                }
                                catch (e)
                                {
                                    this.alfLog('error', 'Encountered error during response handling', response, consoleRequest, e);
                                    this._runRequestLikeCrazy(consoleRequest);
                                    consoleRequest.completed = true;
                                    consoleRequest.checkTimer.remove();
                                }
                            }
                        },

                        onExecuteInBackendFailure : function jsconsole_backend_LegacyRepositoryConsoleBackend__onExecuteInBackendFailure(
                                consoleRequest, response)
                        {
                            this.alfLog('error', 'Request failed', response, consoleRequest);
                            consoleRequest.endTime = consoleRequest.endTime || new Date();

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
                                    this.alfPublish(this.resetConsoleOutputTopic, {
                                        backend : this.backendId
                                    }, false, false, consoleRequest.alfResponseScope || '');

                                    if (typeof response === 'string')
                                    {
                                        this.alfPublish(this.appendConsoleOutputTopic, {
                                            backend : this.backendId,
                                            content : response
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }
                                    else
                                    {
                                        if (lang.isArray(response.printOutput))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.printOutput.join('\n')
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        if (response.status)
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.status.code + ' ' + response.status.name
                                            }, false, false, consoleRequest.alfResponseScope || '');

                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.status.description
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        if (lang.isString(response.message))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.message
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        if (lang.isString(response.callstack))
                                        {
                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : '\nStacktrace-Details:'
                                            }, false, false, consoleRequest.alfResponseScope || '');

                                            this.alfPublish(this.appendConsoleOutputTopic, {
                                                backend : this.backendId,
                                                content : response.callstack
                                            }, false, false, consoleRequest.alfResponseScope || '');
                                        }

                                        // TODO Handle potential error marks from execution error
                                    }

                                    this._processExecutionStatistics(consoleRequest, response);
                                    this._runRequestLikeCrazy(consoleRequest);
                                    consoleRequest.completed = true;
                                    consoleRequest.checkTimer.remove();
                                }
                            }
                        },

                        onExecuteInBackendCheckProgress : function jsconsole_backend_LegacyRepositoryConsoleBackend__onExecuteInBackendCheckProgress(
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

                        onExecuteInBackendCheckProgressSuccess : function jsconsole_backend_LegacyRepositoryConsoleBackend__onExecuteInBackendCheckProgressSuccess(
                                consoleRequest, response)
                        {
                            this.alfLog('info', 'Progress check succeeded', response, consoleRequest);

                            // if we had an error or entire web script is already done this will be the last update
                            if (response.error === true || response.error === 'true' || lang.isString(response.webscriptPerf))
                            {
                                consoleRequest.endTime = consoleRequest.endTime || new Date();
                            }

                            if (consoleRequest.superseded !== true)
                            {
                                this.alfPublish(this.resetConsoleOutputTopic, {
                                    backend : this.backendId
                                }, false, false, consoleRequest.alfResponseScope || '');

                                if (typeof response === 'string')
                                {
                                    this.alfPublish(this.appendConsoleOutputTopic, {
                                        backend : this.backendId,
                                        content : response
                                    }, false, false, consoleRequest.alfResponseScope || '');

                                    this.alfPublish(this.updateTemplateOutputTopic, {
                                        backend : this.backendId,
                                        content : ''
                                    }, false, false, consoleRequest.alfResponseScope || '');
                                }
                                else
                                {
                                    if (lang.isArray(response.printOutput))
                                    {
                                        this.alfPublish(this.appendConsoleOutputTopic, {
                                            backend : this.backendId,
                                            content : response.printOutput.join('\n')
                                        }, false, false, consoleRequest.alfResponseScope || '');
                                    }

                                    // if we had an error or entire web script is already done this will be the last update
                                    if (response.error === true || response.error === 'true' || lang.isString(response.webscriptPerf))
                                    {
                                        this.alfPublish(this.updateTemplateOutputTopic, {
                                            backend : this.backendId,
                                            content : response.renderedTemplate || ''
                                        }, false, false, consoleRequest.alfResponseScope || '');

                                        if (response.error === true || response.error === 'true')
                                        {
                                            // TODO Handle potential error marks from execution error
                                        }

                                        this._processExecutionStatistics(consoleRequest, response);
                                        this._runRequestLikeCrazy(consoleRequest);
                                        consoleRequest.completed = true;
                                        consoleRequest.checkTimer.remove();
                                    }
                                }
                            }
                        },

                        _runRequestLikeCrazy : function jsconsole_backend_LegacyRepositoryConsoleBackend__runRequestLikeCrazy(
                                consoleRequest)
                        {
                            if (consoleRequest.runLikeCrazy >= 0)
                            {
                                setTimeout(lang.hitch(this,
                                        function jsconsole_backend_LegacyRepositoryConsoleBackend__runRequestLikeCrazy_trigger(
                                                oldConsoleRequest)
                                        {
                                            var repeatConsoleRequest = lang.clone(oldConsoleRequest);
                                            lang.setObject('rqData.resultChannel', this.generateUuid(), repeatConsoleRequest);
                                            lang.setObject('startTime', new Date(), repeatConsoleRequest);
                                            delete repeatConsoleRequest.completed;
                                            delete repeatConsoleRequest.superseded;

                                            this.serviceXhr({
                                                url : Constants.PROXY_URI + 'de/fme/jsconsole/execute',
                                                data : repeatConsoleRequest.rqData,
                                                method : 'POST',
                                                successCallback : lang.hitch(this, this.onExecuteInBackendSuccess, repeatConsoleRequest),
                                                failureCallback : lang.hitch(this, this.onExecuteInBackendFailure, repeatConsoleRequest)
                                            });

                                            repeatConsoleRequest.checkTimer = functionUtils.addRepeatingFunction(lang.hitch(this,
                                                    this.onExecuteInBackendCheckProgress, repeatConsoleRequest), 'MEDIUM');
                                            this._activeRequestByScope[repeatConsoleRequest.alfResponseScope] = repeatConsoleRequest;
                                        }, consoleRequest), consoleRequest.runLikeCrazy);
                            }
                        },

                        _processExecutionStatistics : function jsconsole_backend_LegacyRepositoryConsoleBackend__processExecutionStatistics(
                                consoleRequest, response)
                        {
                            var overallTime, jsTime, ftlTime, webScriptTime, overhead, networkTime;

                            overallTime = consoleRequest.endTime.getTime() - consoleRequest.startTime.getTime();
                            jsTime = parseInt(response.scriptPerf || '0', 10);
                            ftlTime = parseInt(response.freemarkerPerf || '0', 10);
                            webScriptTime = parseInt(response.webscriptPerf || '0', 10);
                            overhead = webScriptTime - jsTime - ftlTime;
                            networkTime = overallTime - webScriptTime;

                            this.alfPublish(this.reportExecutionPerformanceTopic, {
                                backend : this.backendId,
                                metrics : [ {
                                    type : 'javaScriptTime',
                                    value : jsTime
                                }, {
                                    type : 'freemarkerTime',
                                    value : ftlTime
                                }, {
                                    type : 'overhead',
                                    value : overhead
                                }, {
                                    type : 'webScriptTime',
                                    value : webScriptTime
                                }, {
                                    type : 'network',
                                    value : networkTime
                                }, {
                                    type : 'totalTime',
                                    value : overallTime
                                } ]
                            }, false, false, consoleRequest.alfResponseScope || '');
                        }

                    });
        });