/**
 * This module defines the root tool widget for JavaScript Console addon. It encapsulates and acts as an owner/coordinator of all special
 * use sub-widgets depending on the currently active JavaScript Console endpoint.
 * 
 * @module jsconsole/tool/JavaScriptConsoleTool
 * @extends module:dijit/_WidgetBase
 * @mixes module:dijit/_TemplatedMixin
 * @mixes module:alfresco/core/Core
 * @mixes module:alfresco/core/ResizeMixin
 * @mixes module:alfresco/core/ObjectProcessingMixin
 * @mixes module:alfresco/core/WidgetsOverrideMixin
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @requires module:dojo/_base/declare
 * @requires module:dojo/_base/lang
 * @requires module:dojo/_base/array
 * @requires module:dojo/dom-class
 * @requires module:dojo/dom-style
 * @requires module:dojo/dom-geometry
 * @requires module:dojo/query
 * @requires module:dojo/window
 * @requires module:alfresco/util/functionUtils
 * @author Axel Faust
 */
define(
        [ 'dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'alfresco/core/Core', 'alfresco/core/CoreWidgetProcessing',
                'alfresco/core/ResizeMixin', 'alfresco/core/ObjectProcessingMixin', 'alfresco/core/WidgetsOverrideMixin',
                'jsconsole/_ConsoleTopicsMixin', 'dojo/text!./templates/JavaScriptConsoleTool.html', 'dojo/_base/lang', 'dojo/_base/array',
                'dojo/dom-class', 'dojo/dom-style', 'dojo/dom-geometry', 'dojo/query', 'dojo/window', 'alfresco/util/functionUtils' ],
        function(declare, _Widget, _Templated, Core, CoreWidgetProcessing, ResizeMixin, ObjectProcessingMixin, WidgetsOverrideMixin,
                _ConsoleTopicsMixin, template, lang, array, domClass, domStyle, domGeom, query, win, functionUtils)
        {
            return declare(
                    [ _Widget, _Templated, Core, CoreWidgetProcessing, ResizeMixin, ObjectProcessingMixin, WidgetsOverrideMixin,
                            _ConsoleTopicsMixin ],
                    {

                        templateString : template,

                        cssRequirements : [ {
                            cssFile : './css/JavaScriptConsoleTool.css'
                        } ],

                        i18nRequirements : [ {
                            i18nFile : './i18n/JavaScriptConsoleTool.properties'
                        } ],

                        restrictToPageHeight : true,

                        widgetsForMenuBarOverrides : null,

                        widgetsForMenuBar : [
                                {
                                    id : 'BACKEND_SELECTION',
                                    name : 'jsconsole/menu/CheckableBackendMenuBarPopup',
                                    config : {
                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.backends.label',
                                        title : 'jsconsole.tool.JavaScriptConsoleTool.menu.backends.title'
                                    }
                                },
                                {
                                    id : 'DOCUMENTATION_MENU',
                                    name : 'alfresco/menus/AlfMenuBarPopup',
                                    config : {
                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.label',
                                        widgets : [
                                                {
                                                    name : 'alfresco/menus/AlfMenuGroup',
                                                    config : {
                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.label',
                                                        widgets : [
                                                                {
                                                                    name : 'alfresco/menus/AlfMenuItem',
                                                                    config : {
                                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.mozilla.label',
                                                                        targetUrl : 'https://developer.mozilla.org/en/JavaScript/Reference',
                                                                        targetUrlType : 'FULL_PATH'
                                                                    }
                                                                },
                                                                {
                                                                    name : 'alfresco/menus/AlfMenuItem',
                                                                    config : {
                                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.w3schools.label',
                                                                        targetUrl : 'http://www.w3schools.com/jsref/default.asp',
                                                                        targetUrlType : 'FULL_PATH'
                                                                    }
                                                                },
                                                                {
                                                                    name : 'alfresco/menus/AlfMenuItem',
                                                                    config : {
                                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.alf51scriptRootObjects.label',
                                                                        targetUrl : 'http://docs.alfresco.com/5.1/references/API-JS-rootscoped.html',
                                                                        targetUrlType : 'FULL_PATH'
                                                                    }
                                                                },
                                                                {
                                                                    name : 'alfresco/menus/AlfMenuItem',
                                                                    config : {
                                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.alf51scriptApi.label',
                                                                        targetUrl : 'http://docs.alfresco.com/5.1/references/API-JS-Scripting-API.html',
                                                                        targetUrlType : 'FULL_PATH'
                                                                    }
                                                                },
                                                                {
                                                                    name : 'alfresco/menus/AlfMenuItem',
                                                                    config : {
                                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.js.alf51scriptServicesApi.label',
                                                                        targetUrl : 'http://docs.alfresco.com/5.1/references/API-JS-Services.html',
                                                                        targetUrlType : 'FULL_PATH'
                                                                    }
                                                                } ]
                                                    }
                                                },
                                                {
                                                    name : 'alfresco/menus/AlfMenuGroup',
                                                    config : {
                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.ftl.label',
                                                        widgets : [ {
                                                            name : 'alfresco/menus/AlfMenuItem',
                                                            config : {
                                                                label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.ftl.manual.label',
                                                                targetUrl : 'http://freemarker.org/docs/index.html',
                                                                targetUrlType : 'FULL_PATH'
                                                            }
                                                        } ]
                                                    }
                                                },
                                                ,
                                                {
                                                    name : 'alfresco/menus/AlfMenuGroup',
                                                    config : {
                                                        label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.search.label',
                                                        widgets : [ {
                                                            name : 'alfresco/menus/AlfMenuItem',
                                                            config : {
                                                                label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.search.fts.label',
                                                                targetUrl : 'http://docs.alfresco.com/5.1/concepts/rm-searchsyntax-intro.html',
                                                                targetUrlType : 'FULL_PATH'
                                                            }
                                                        }, {
                                                            name : 'alfresco/menus/AlfMenuItem',
                                                            config : {
                                                                label : 'jsconsole.tool.JavaScriptConsoleTool.menu.documentation.search.cmisql.label',
                                                                targetUrl : 'http://docs.oasis-open.org/cmis/CMIS/v1.1/errata01/os/CMIS-v1.1-errata01-os-complete.html#x1-10500014',
                                                                targetUrlType : 'FULL_PATH'
                                                            }
                                                        } ]
                                                    }
                                                }]
                                    }
                                }
                        // TODO CodeMirror theme selection
                        ],

                        // TODO Need explicit focus grant for editor in first visible tab

                        widgetsForInputTabsOverrides : null,

                        widgetsForInputTabs : [ {
                            id : 'JS-INPUT',
                            name : 'jsconsole/editor/JavaScriptEditor',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.jsInput.title',
                            requires : [ 'javascriptSource' ],
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--javascriptEditor',
                                // autofocus is bad when used e.g. in AlfTabContainer
                                autofocus : false,
                                placeholder : '{jsconsole.tool.JavaScriptConsoleTool.tab.jsInput.placeholder}',
                                updateContentTopic : '{updateJavaScriptSourceTopic}',
                                contentUpdatedTopic : '{javaScriptSourceUpdatedTopic}',
                                typeDefinitionsLoadedTopic : '{javaScriptTypeDefinitionsLoadedTopic}',
                                useLocalStorage : true,
                                localStorageKeyPrefix : 'js-console.input.javascript'
                            }
                        }, {
                            id : 'FTL-INPUT',
                            name : 'jsconsole/editor/CodeMirrorEditor',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.ftlInput.title',
                            requires : [ 'freemarkerSource' ],
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--freemarkerEditor',
                                // autofocus is bad when used e.g. in AlfTabContainer
                                autofocus : false,
                                placeholder : '{jsconsole.tool.JavaScriptConsoleTool.tab.ftlInput.placeholder}',
                                updateContentTopic : '{updateFreemarkerSourceTopic}',
                                contentUpdatedTopic : '{freemarkerSourceUpdatedTopic}',
                                useLocalStorage : true,
                                localStorageKeyPrefix : 'js-console.input.freemarker'
                            }
                        }, {
                            // TODO Make into a block of two alternative widgets (label for "no parameters" and form)
                            id : 'PARAMS-INPUT',
                            name : 'alfresco/forms/DynamicForm',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.parameterInput.title',
                            delayProcessing : false,
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--parameterForm',
                                subscriptionTopic : '{reinitializeExecutionParameterFormTopic}',
                                formWidgetsProperty : 'widgets',
                                formWidetsPropertyStringified : false,
                                formValueProperty : 'values',
                                waitForPageWidgets : false,
                                pubSubScope : '{executionParameterFormPubSubScope}',
                                autoSavePublishTopic : '{autoSaveExecutionParameterFormTopic}'
                            // TODO use localStorage to remember last parameters
                            }
                        } ],

                        widgetsForButtonsOverrides : null,

                        widgetsForButtons : [ {
                            id : 'EXECUTE_BUTTON',
                            name : 'jsconsole/button/DynamicPayloadButton',
                            config : {
                                label : 'jsconsole.tool.JavaScriptConsoleTool.button.execute.label',
                                title : 'jsconsole.tool.JavaScriptConsoleTool.button.execute.title',
                                additionalCssClasses : 'primary-call-to-action',
                                publishTopic : '{executeInBackendTopic}',
                                publishGlobal : true,
                                publishPayload : {},
                                publishPayloadSubscriptions : [ {
                                    topic : '{toggleActiveBackendTopic}',
                                    dataMapping : {
                                        backend : 'backend'
                                    }
                                }, {
                                    topic : '{javaScriptSourceUpdatedTopic}',
                                    dataMapping : {
                                        content : 'javaScriptSource',
                                        selectedContent : 'selectedJavaScriptSource'
                                    }
                                }, {
                                    topic : '{freemarkerSourceUpdatedTopic}',
                                    dataMapping : {
                                        content : 'freemarkerSource'
                                    }
                                }, {
                                    topic : '{autoSaveExecutionParameterFormTopic}',
                                    subscribeScope : '{executionParameterFormPubSubScope}',
                                    dataMapping : {
                                        executionParameter : 'executionParameter'
                                    }
                                }
                                // TODO Configure other dynamic payload elements
                                ]
                            }
                        } ],

                        widgetsForOutputTabsOverrides : null,

                        widgetsForOutputTabs : [ {
                            id : 'CONSOLE-OUTPUT',
                            name : 'jsconsole/editor/CodeMirrorEditor',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.consoleOutput.title',
                            requires : [ 'consoleOutput' ],
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--consoleOutput',
                                readOnly : true,
                                autofocus : false,
                                placeholder : '{jsconsole.tool.JavaScriptConsoleTool.tab.consoleOutput.placeholder}',
                                clearContentTopic : '{resetConsoleOutputTopic}',
                                appendContentTopic : '{appendConsoleOutputTopic}'
                            }
                        }, {
                            id : 'TEXT-OUTPUT',
                            name : 'jsconsole/editor/CodeMirrorEditor',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.textOutput.title',
                            requires : [ 'templateOutput' ],
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--templateOutput',
                                readOnly : true,
                                autofocus : false,
                                placeholder : '{jsconsole.tool.JavaScriptConsoleTool.tab.textOutput.placeholder}',
                                updateContentTopic : '{updateTemplateOutputTopic}'
                            }
                        }, {
                            id : 'PERFORMANCE-REPORT',
                            name : 'jsconsole/tool/PerformancePanel',
                            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.performanceReport.title',
                            delayProcessing : false,
                            requires : [ 'performanceReport' ],
                            config : {
                                additionalCssClasses : 'jsconsole-tool-JavaScriptConsoleTool--performanceReport'
                            }
                        } ],

                        executionParameterFormPubSubScope : null,

                        // these are primarily internal, so not contained in topics mixin
                        reinitializeExecutionParameterFormTopic : 'JS_CONSOLE_REINITIALIZE_EXECUTION_PARAMETER_FORM',

                        autoSaveExecutionParameterFormTopic : 'JS_CONSOLE_AUTO_SAVE_EXECUTION_PARAMETER_FORM',

                        postMixInProperties : function jsconsole_tool_JavaScriptConsoleTool__postMixInProperties()
                        {
                            this.inherited(arguments);
                            if (this.pubSubScope === '')
                            {
                                // a JavaScript Console Tool instance should (as a complex construct) always have an isolated pubSubScope
                                this.pubSubScope = this.generateUuid();
                            }

                            // we need to control the form pubSubScope
                            if (this.executionParameterFormPubSubScope === null)
                            {
                                this.executionParameterFormPubSubScope = this.generateUuid();
                            }
                        },

                        postCreate : function jsconsole_tool_JavaScriptConsoleTool__postCreate()
                        {
                            var collectTabSupportRequirements, footerNodes;

                            this._activeBackend = null;
                            this._activeBackendName = null;
                            this._executionParameterValuesByBackend = {};
                            this._tabSupportRequirements = {};
                            this._backendDefinitions = {};

                            collectTabSupportRequirements = function jsconsole_tool_JavaScriptConsoleTool__postCreate_collectTabSupportRequirements(
                                    tabWidget)
                            {
                                if (lang.isString(tabWidget.id))
                                {
                                    if (lang.isArray(tabWidget.requires))
                                    {
                                        this._tabSupportRequirements[tabWidget.id] = tabWidget.requires.slice(0);
                                    }
                                    else
                                    {
                                        this._tabSupportRequirements[tabWidget.id] = [];
                                    }
                                }
                            };

                            this._setupMenuBar();
                            this._setupInputTabs(collectTabSupportRequirements);
                            this._setupButtons();
                            this._setupOutputTabs(collectTabSupportRequirements);

                            this.addResizeListener(this.domNode);

                            if (this.restrictToPageHeight === true)
                            {
                                footerNodes = query(
                                        '.alfresco-share > div.sticky-footer, .alfresco-share > .sticky-wrapper > .sticky-push',
                                        document.documentElement);
                                if (footerNodes.length > 0)
                                {
                                    this._footerHeight = footerNodes[0].offsetHeight;
                                }
                                else
                                {
                                    this._footerHeight = 0;
                                }

                                this._recalculateHeight();

                                this.alfSetupResizeSubscriptions(this.onResize, this);
                            }

                            // this will only listen on "our" pubSubScope
                            this.alfSubscribe(this.discoverBackendsTopic + '_SUCCESS', lang.hitch(this, this.onBackendDiscoveryResponse));
                            this.alfSubscribe(this.toggleActiveBackendTopic, lang.hitch(this, this.onToggleActiveBackendRequest));
                            this.alfSubscribe(this.autoSaveExecutionParameterFormTopic, lang.hitch(this, this.onExecutionParameterUpdate),
                                    false, false, this.executionParameterFormPubSubScope);

                            // trigger discovery
                            this.alfPublish(this.discoverBackendsTopic, {}, true);
                        },

                        onResize : function jsconsole_tool_JavaScriptConsoleTool__onResize(resizedNode)
                        {
                            // schedule for later to avoid costly / too aggressive handling
                            functionUtils.debounce({
                                name : 'jsconsole/tool/JavaScriptConsoleTool-resize',
                                func : lang.hitch(this, this._recalculateHeight),
                                timeoutMs : 50
                            });
                        },

                        _setupMenuBar : function jsconsole_tool_JavaScriptConsoleTool__setupMenuBar()
                        {
                            var menuBarWidgets;

                            this.applyWidgetOverrides(this.widgetsForMenuBar, this.widgetsForMenuBarOverrides);
                            if (lang.isArray(this.widgetsForMenuBar) && this.widgetsForMenuBar.length > 0)
                            {
                                this.processObject([ 'replaceTopicTokens', 'replacePubSubScopeTokens', 'processMessageTokens' ],
                                        this.widgetsForMenuBar);
                                menuBarWidgets = [ {
                                    name : 'alfresco/menus/AlfMenuBar',
                                    config : {
                                        widgets : this.widgetsForMenuBar
                                    }
                                } ];
                                this.processWidgets(menuBarWidgets, this.consoleMenuBarNode, 'createConsoleMenuBar');
                            }
                            else
                            {
                                domClass.add(this.consoleMenuBarNode, 'share-hidden');
                            }
                        },

                        _setupInputTabs : function jsconsole_tool_JavaScriptConsoleTool__setupInputTabs(collectTabSupportRequirements)
                        {
                            var inputWidgets;

                            this.applyWidgetOverrides(this.widgetsForInputTabs, this.widgetsForInputTabsOverrides);
                            if (lang.isArray(this.widgetsForInputTabs) && this.widgetsForInputTabs.length > 0)
                            {
                                this.processObject([ 'replaceTopicTokens', 'replacePubSubScopeTokens', 'processMessageTokens' ],
                                        this.widgetsForInputTabs);
                                array.forEach(this.widgetsForInputTabs, collectTabSupportRequirements, this);

                                inputWidgets = [ {
                                    name : 'alfresco/layout/AlfTabContainer',
                                    config : {
                                        tabDisablementTopic : 'JS_CONSOLE_DISABLE_TAB',
                                        widgets : this.widgetsForInputTabs
                                    }
                                } ];

                                this.processWidgets(inputWidgets, this.inputContainerNode, 'createInputTabs');
                            }
                            else
                            {
                                domClass.add(this.inputContainerNode, 'share-hidden');
                            }
                        },

                        _setupButtons : function jsconsole_tool_JavaScriptConsoleTool__setupButtons()
                        {
                            this.applyWidgetOverrides(this.widgetsForButtons, this.widgetsForButtonsOverrides);
                            if (lang.isArray(this.widgetsForButtons) && this.widgetsForButtons.length > 0)
                            {
                                this.processObject([ 'replaceTopicTokens', 'replacePubSubScopeTokens', 'processMessageTokens' ],
                                        this.widgetsForButtons);
                                this.processWidgets(this.widgetsForButtons, this.consoleButtonsNode, 'createButtons');
                            }
                            else
                            {
                                domClass.add(this.consoleButtonsNode, 'share-hidden');
                            }
                        },

                        _setupOutputTabs : function jsconsole_tool_JavaScriptConsoleTool__setupOutputTabs(collectTabSupportRequirements)
                        {
                            var outputWidgets;

                            this.applyWidgetOverrides(this.widgetsForOutputTabs, this.widgetsForOutputTabsOverrides);
                            if (lang.isArray(this.widgetsForOutputTabs) && this.widgetsForOutputTabs.length > 0)
                            {
                                this.processObject([ 'replaceTopicTokens', 'replacePubSubScopeTokens', 'processMessageTokens' ],
                                        this.widgetsForOutputTabs);
                                array.forEach(this.widgetsForOutputTabs, collectTabSupportRequirements, this);

                                outputWidgets = [ {
                                    name : 'alfresco/layout/AlfTabContainer',
                                    config : {
                                        tabDisablementTopic : 'JS_CONSOLE_DISABLE_TAB',
                                        widgets : this.widgetsForOutputTabs
                                    }
                                } ];

                                this.processWidgets(outputWidgets, this.outputContainerNode, 'createOutputTabs');
                            }
                            else
                            {
                                domClass.add(this.outputContainerNode, 'share-hidden');
                            }
                        },

                        _recalculateHeight : function jsconsole_tool_JavaScriptConsoleTool__recalculateHeight()
                        {
                            var position, winBox;

                            position = domGeom.position(this.domNode, true);
                            // calculate window size without us
                            domClass.add(this.domNode, 'share-hidden');
                            winBox = win.getBox();
                            domStyle.set(this.domNode, {
                                // 1em is for typical #bd padding-bottom
                                height : 'calc(' + (winBox.h - this._footerHeight - position.y) + 'px - 1em)'
                            });
                            domClass.remove(this.domNode, 'share-hidden');
                        },

                        replacePubSubScopeTokens : function jsconsole_tool_JavaScriptConsoleTool__replacePubSubScopeTokens(v)
                        {
                            var result, scopeKey;

                            if (/^\{([a-zA-Z]+PubSubScope|pubSubScope)}$/.test(v))
                            {
                                scopeKey = v.slice(1, -1);
                                if (lang.isString(this[scopeKey]))
                                {
                                    result = this[scopeKey];
                                }
                                else
                                {
                                    result = v;
                                }
                            }
                            else if (/^\{[^}]*}$/.test(v))
                            {
                                result = v;
                            }
                            else
                            {
                                result = lang.replace(v, lang.hitch(this,
                                        function jsconsole_tool_JavaScriptConsoleTool__replacePubSubScopeTokens(o, tib, twb)
                                        {
                                            return this.replacePubSubScopeTokens(tib);
                                        }, this));
                            }

                            return result;
                        },

                        replaceTopicTokens : function jsconsole_tool_JavaScriptConsoleTool__replaceTopicTokens(v)
                        {
                            var result, topicKey;
                            if (/^\{[a-zA-Z]+Topic\}$/.test(v))
                            {
                                topicKey = v.slice(1, -1);
                                if (lang.isString(this[topicKey]))
                                {
                                    result = this[topicKey];
                                }
                                else
                                {
                                    result = v;
                                }
                            }
                            else if (/^\{[^}]*}$/.test(v))
                            {
                                result = v;
                            }
                            else
                            {
                                result = lang.replace(v, lang.hitch(this,
                                        function jsconsole_tool_JavaScriptConsoleTool__replaceTopicTokens_replace(o, tib, twb)
                                        {
                                            return this.replaceTopicTokens(tib);
                                        }, this));
                            }

                            return result;
                        },

                        onBackendDiscoveryResponse : function jsconsole_tool_JavaScriptConsoleTool__onBackendDiscoveryResponse(payload)
                        {
                            var backendDefinition;
                            if (payload !== undefined && payload !== null && lang.isString(payload.backend))
                            {
                                backendDefinition = this.alfCleanFrameworkAttributes(payload);
                                this._backendDefinitions[backendDefinition.backend] = backendDefinition;
                            }
                        },

                        onToggleActiveBackendRequest : function jsconsole_tool_JavaScriptConsoleTool__onToggleActiveBackendRequest(payload)
                        {
                            var backendDefinition, reinitializeParameterFormPayload;

                            if (payload !== undefined && payload !== null && lang.isString(payload.backend)
                                    && this._backendDefinitions.hasOwnProperty(payload.backend))
                            {
                                backendDefinition = this._backendDefinitions[payload.backend];
                                // TODO enable/disable tabs based on feature requirements

                                reinitializeParameterFormPayload = {
                                    widgets : [],
                                    values : {
                                        executionParameter : this._executionParameterValuesByBackend[payload.backend] || {}
                                    }
                                };

                                if (lang.isArray(backendDefinition.executionParameterFormWidgets))
                                {
                                    reinitializeParameterFormPayload.widgets = JSON.parse(JSON
                                            .stringify(backendDefinition.executionParameterFormWidgets));
                                }

                                this.alfPublish(this.reinitializeExecutionParameterFormTopic, reinitializeParameterFormPayload, false,
                                        false, this.executionParameterFormPubSubScope);

                                if (lang.isString(this._activeBackendName))
                                {
                                    domClass.remove(this.domNode, 'jsconsole-tool-JavaScriptConsoleTool--active-backend--'
                                            + this._activeBackendName);
                                }
                                this._activeBackend = payload.backend;
                                this._activeBackendName = backendDefinition.name;
                                domClass.add(this.domNode, 'jsconsole-tool-JavaScriptConsoleTool--active-backend--'
                                        + this._activeBackendName);
                            }
                        },

                        onExecutionParameterUpdate : function jsconsole_tool_JavaScriptConsoleTool__onExecutionParameterUpdate(payload)
                        {
                            var executionParameter = lang.getObject('executionParameter', false, payload);
                            this._executionParameterValuesByBackend[this._activeBackend] = executionParameter;
                        }
                    });
        });
