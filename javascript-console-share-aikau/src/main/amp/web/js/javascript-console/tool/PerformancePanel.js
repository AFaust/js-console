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
        'dojo/text!./templates/PerformancePanel.html', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/dom-construct' ], function(declare,
        _Widget, _Templated, Core, _ConsoleTopicsMixin, template, lang, array, domConstruct)
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
            this.alfSubscribe(this.reportExecutionPerformanceTopic, lang.hitch(this, this.onExecutionPerformanceReport));
        },

        onExecutionPerformanceReport : function jsconsole_tool_PerformancePanel__onExecutionPerformanceReport(payload)
        {
            var docFrag;

            while (this.domNode.lastChild)
            {
                this.domNode.removeChild(this.domNode.lastChild);
            }

            if (lang.isArray(payload.metrics))
            {
                docFrag = document.createDocumentFragment();
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
                        }, docFrag);

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
            }
        }
    });
});