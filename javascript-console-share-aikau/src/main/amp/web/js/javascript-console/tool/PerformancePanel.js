/**
 * This module defines the root tool widget for JavaScript Console addon. It encapsulates and acts as an owner/coordinator of all special
 * use sub-widgets depending on the currently active JavaScript Console endpoint.
 * 
 * @module jsconsole/tool/JavaScriptConsoleTool
 * @extends module:dijit/_WidgetBase
 * @mixes module:dijit/_TemplatedMixin
 * @mixes module:alfresco/core/Core
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'alfresco/core/Core', 'jsconsole/_ConsoleTopicsMixin',
        'dojo/text!./templates/PerformancePanel.html', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/dom-construct', 'dojo/dom-style' ],
        function(declare, _Widget, _Templated, Core, _ConsoleTopicsMixin, template, lang, array, domConstruct, domStyle)
        {
            return declare([ _Widget, _Templated, Core, _ConsoleTopicsMixin ], {
                templateString : template,

                cssRequirements : [ {
                    cssFile : './css/PerformancePanel.css'
                } ],

                i18nRequirements : [ {
                    i18nFile : './i18n/PerformancePanel.properties'
                } ],

                postCreate : function jsconsole_tool_PerformancePanel__postCreate()
                {
                    this.inherited(arguments);

                    this.alfSubscribe(this.toggleActiveBackendTopic, lang.hitch(this, this.onToggleActiveBackendRequest));
                    this.alfSubscribe(this.reportExecutionPerformanceTopic, lang.hitch(this, this.onExecutionPerformanceReport));

                    this._childrenByBackend = {};
                },

                onToggleActiveBackendRequest : function jsconsole_tool_PerformancePanel__onToggleActiveBackendRequest(payload)
                {
                    var backend;

                    if (lang.isString(payload.backend))
                    {
                        for (backend in this._childrenByBackend)
                        {
                            if (this._childrenByBackend.hasOwnProperty(backend))
                            {
                                if (backend === payload.backend)
                                {
                                    domStyle.set(this._childrenByBackend[backend], 'display', '');
                                }
                                else
                                {
                                    domStyle.set(this._childrenByBackend[backend], 'display', 'none');
                                }
                            }
                        }
                        this._currentBackend = payload.backend;
                    }
                },

                onExecutionPerformanceReport : function jsconsole_tool_PerformancePanel__onExecutionPerformanceReport(payload)
                {
                    var docFrag, backendContainer;

                    if (lang.isString(payload.backend))
                    {
                        if (this._childrenByBackend.hasOwnProperty(payload.backend) && this._childrenByBackend[payload.backend] !== null)
                        {
                            this.domNode.removeChild(this._childrenByBackend[payload.backend]);
                            delete this._childrenByBackend[payload.backend];
                        }

                        if (lang.isArray(payload.metrics))
                        {
                            docFrag = document.createDocumentFragment();
                            backendContainer = domConstruct.create('div', {
                                className : 'backendMetrics'
                            }, docFrag);

                            array.forEach(payload.metrics, function(metric, index)
                            {
                                var type, label, value, unit, title, container;

                                if (metric !== null && lang.isObject(metric))
                                {
                                    type = metric.type || 'unknown';
                                    label = metric.label || ('jsconsole.tool.PerformancePanel.metric.' + type + '.label');
                                    value = metric.value || 0;
                                    unit = metric.unit || 'ms';

                                    label = this.message(label);
                                    title = this.message('jsconsole.tool.PerformancePanel.metric.title', [ label, String(value), unit ]);

                                    container = domConstruct.create('div', {
                                        className : 'metricContainer',
                                        title : title
                                    }, backendContainer);

                                    domConstruct.create('span', {
                                        className : 'metricLabel',
                                        innerHTML : this.encodeHTML(label) + ':'
                                    }, container);
                                    domConstruct.create('span', {
                                        className : 'metricValue',
                                        innerHTML : this.encodeHTML(String(value))
                                    }, container);
                                    domConstruct.create('span', {
                                        className : 'metricUnit',
                                        innerHTML : this.encodeHTML(unit)
                                    }, container);
                                }

                            }, this);

                            this.domNode.appendChild(docFrag);
                            this._childrenByBackend[payload.backend] = this.domNode.lastChild;

                            if (payload.backend !== this._currentBackend)
                            {
                                domStyle.set(this._childrenByBackend[payload.backend], 'display', 'none');
                            }
                        }
                    }
                }
            });
        });