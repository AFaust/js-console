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
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'alfresco/core/Core', 'alfresco/core/CoreWidgetProcessing',
        'alfresco/core/ResizeMixin', 'alfresco/core/ObjectProcessingMixin', 'jsconsole/_ConsoleTopicsMixin',
        'dojo/text!./templates/JavaScriptConsoleTool.html', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/dom-class' ], function(declare,
        _Widget, _Templated, Core, CoreWidgetProcessing, ResizeMixin, ObjectProcessingMixin, _ConsoleTopicsMixin, template, lang, array,
        domClass)
{
    return declare([ _Widget, _Templated, Core, CoreWidgetProcessing, ResizeMixin, ObjectProcessingMixin, _ConsoleTopicsMixin ], {

        templateString : template,

        cssRequirements : [ {
            cssFile : './css/JavaScriptConsoleTool.css'
        } ],

        i18nRequirements : [ {
            i18nFile : './i18n/JavaScriptConsoleTool.properties'
        } ],

        widgetsForDefaultMenuBar : [ {
            id : 'BACKEND_SELECTION',
            name : 'jsconsole/menu/CheckableBackendMenuBarPopup',
            config : {
                label : 'jsconsole.tool.JavaScriptConsoleTool.menu.backends.label',
                title : 'jsconsole.tool.JavaScriptConsoleTool.menu.backends.title',
            }
        }
        // TODO CodeMirror theme selection
        ],

        widgetsForMenuBar : null,

        // TODO Need explicit focus grant for editor in first visible tab
        widgetsForDefaultInputTabs : [ {
            id : 'JS-INPUT',
            name : 'jsconsole/editors/JavaScriptEditor',
            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.jsInput.title',
            requires : [ 'javascriptSource' ],
            config : {
                // autofocus is bad when used e.g. in AlfTabContainer
                autofocus : false,
                updateContentTopic : '{updateJavaScriptSourceTopic}',
                contentUpdatedTopic : '{javaScriptSourceUpdatedTopic}'
            }
        } ],

        widgetsForInputTabs : null,

        widgetsForDefaultButtons : [ {
            id : 'EXECUTE_BUTTON',
            name : 'alfresco/buttons/AlfDynamicPayloadButton',
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
                }
                // TODO Configure other dynamic payload elements
                ]
            }
        } ],

        widgetsForButtons : null,

        widgetsForDefaultOutputTabs : [ {
            id : 'CONSOLE-OUTPUT',
            name : 'jsconsole/editors/CodeMirrorEditor',
            title : 'jsconsole.tool.JavaScriptConsoleTool.tab.consoleOutput.title',
            requires : [ 'consoleOutput' ],
            config : {
                readOnly : true,
                autofocus : false,
                clearContentTopic : '{resetConsoleOutputTopic}',
                appendContentTopic : '{appendConsoleOutputTopic}'
            }
        } ],

        widgetsForOutputTabs : null,

        postMixInProperties : function jsconsole_tool_JavaScriptConsoleTool__postMixInProperties()
        {
            this.inherited(arguments);
            if (this.pubSubScope === '')
            {
                // a JavaScript Console Tool instance should (as a complex construct) always have an isolated pubSubScope
                this.pubSubScope = this.generateUuid();
            }
        },

        postCreate : function jsconsole_tool_JavaScriptConsoleTool__postCreate()
        {
            var menuBarWidgets, inputWidgets, buttonWidgets, outputWidgets, collectTabSupportRequirements;
            
            // TODO Need some way to limit height for AlfTabContainer instances so tool fits on one page

            this._tabSupportRequirements = {}
            this._backendDefinitions = {};

            menuBarWidgets = this.processWidgetsWithDefaults(this.widgetsForDefaultMenuBar, this.widgetsForMenuBar);
            if (lang.isArray(menuBarWidgets) && menuBarWidgets.length > 0)
            {
                menuBarWidgets = [ {
                    name : 'alfresco/menus/AlfMenuBar',
                    config : {
                        widgets : menuBarWidgets
                    }
                } ];
                this.processWidgets(menuBarWidgets, this.consoleMenuBarNode, 'createConsoleMenuBar');
            }
            else
            {
                domClass.add(this.consoleMenuBarNode, 'share-hidden');
            }

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

            inputWidgets = this.processWidgetsWithDefaults(this.widgetsForDefaultInputTabs, this.widgetsForInputTabs);
            if (lang.isArray(inputWidgets) && inputWidgets.length > 0)
            {
                array.forEach(inputWidgets, collectTabSupportRequirements, this);

                inputWidgets = [ {
                    name : 'alfresco/layout/AlfTabContainer',
                    config : {
                        tabDisablementTopic : 'JS_CONSOLE_DISABLE_TAB',
                        widgets : inputWidgets
                    }
                } ];

                this.processWidgets(inputWidgets, this.inputContainerNode, 'createInputTabs');
            }
            else
            {
                domClass.add(this.inputContainerNode, 'share-hidden');
            }

            buttonWidgets = this.processWidgetsWithDefaults(this.widgetsForDefaultButtons, this.widgetsForButtons);
            if (lang.isArray(buttonWidgets) && buttonWidgets.length > 0)
            {
                this.processWidgets(buttonWidgets, this.consoleButtonsNode, 'createButtons');
            }
            else
            {
                domClass.add(this.consoleButtonsNode, 'share-hidden');
            }

            outputWidgets = this.processWidgetsWithDefaults(this.widgetsForDefaultOutputTabs, this.widgetsForOutputTabs);
            if (lang.isArray(outputWidgets) && outputWidgets.length > 0)
            {
                array.forEach(outputWidgets, collectTabSupportRequirements, this);

                outputWidgets = [ {
                    name : 'alfresco/layout/AlfTabContainer',
                    config : {
                        tabDisablementTopic : 'JS_CONSOLE_DISABLE_TAB',
                        widgets : outputWidgets
                    }
                } ];

                this.processWidgets(outputWidgets, this.outputContainerNode, 'createOutputTabs');
            }
            else
            {
                domClass.add(this.outputContainerNode, 'share-hidden');
            }

            this.addResizeListener(this.domNode);

            // this will only listen on "our" pubSubScope
            this.alfSubscribe(this.discoverBackendsTopic + '_SUCCESS', lang.hitch(this, this.onBackendDiscoveryResponse));
            this.alfSubscribe(this.toggleActiveBackendTopic, lang.hitch(this, this.onToggleActiveBackendRequest));

            // trigger discovery
            this.alfPublish(this.discoverBackendsTopic, {}, true);
        },

        processWidgetsWithDefaults : function jsconsole_tool_JavaScriptConsoleTool__processWidgetsWithDefaults(defaultWidgets,
                configuredWidgets)
        {
            var widgetsToCreate, defaultWidgetsById;

            defaultWidgetsById = {};

            if (lang.isArray(defaultWidgets))
            {
                widgetsToCreate = [];
                array.forEach(defaultWidgets,
                        function jsconsole_tool_JavaScriptConsoleTool__processWidgetsWithDefaults_forEachDefaultWidget(defaultWidget)
                        {
                            var widget;
                            if (defaultWidget !== undefined && defaultWidget !== null
                                    && Object.prototype.toString.call(defaultWidget) === '[object Object]'
                                    && lang.isString(defaultWidget.id))
                            {
                                widget = lang.clone(defaultWidget);
                                widgetsToCreate.push(widget);
                                defaultWidgetsById[defaultWidget.id] = widget;
                            }
                        }, this);
            }

            if (lang.isArray(configuredWidgets))
            {
                // re-initialize (drops default widgets)
                widgetsToCreate = [];
                array.forEach(configuredWidgets,
                        function jsconsole_tool_JavaScriptConsoleTool__processWidgetsWithDefaults_forEachConfiguredWidget(configuredWidget)
                        {
                            var widgetId, widget, config;

                            if (configuredWidget !== undefined && configuredWidget !== null
                                    && Object.prototype.toString.call(configuredWidget) === '[object Object]')
                            {
                                widgetId = configuredWidget.id;
                                if (lang.isString(widgetId) && defaultWidgetsById.hasOwnProperty(widgetId))
                                {
                                    widget = lang.clone(defaultWidgetsById[widgetId]);
                                    config = widget.config || {};

                                    config = lang.mixin(config, configuredWidget.config || {});

                                    delete widget.config;
                                    widget = lang.mixin(widget, configuredWidget);
                                    widget.config = config;
                                }
                                else
                                {
                                    widget = configuredWidget;
                                }

                                if (lang.isString(widget.name))
                                {
                                    widgetsToCreate.push(widget);
                                }
                            }

                        }, this);
            }

            this.processObject([ 'replaceTopicPlaceholders' ], widgetsToCreate);

            return widgetsToCreate;
        },

        replaceTopicPlaceholders : function jsconsole_tool_JavaScriptConsoleTool__replaceTopicPlaceholders(v)
        {
            var result, topicKey;
            if (/^{[a-zA-Z]+Topic}$/.test(v))
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
            else
            {
                result = v;
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
            // TODO enable/disable tabs based on feature requirements
        }
    });
});