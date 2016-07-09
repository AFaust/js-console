/**
 * This module provides the backend service implementation for the 'legacy' Repository-tier JavaScript Console.
 * 
 * @module jsconsole/menu/CheckableBackendMenuBarPopup
 * @extends module:alfresco/menus/AlfMenuBarPopup
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'alfresco/menus/AlfMenuBarPopup', 'jsconsole/_ConsoleTopicsMixin', 'dojo/_base/lang', 'dojo/_base/array',
        'alfresco/util/functionUtils' ], function(declare, MenuBarPopup, _ConsoleTopicsMixin, lang, array, functionUtils)
{
    return declare([ MenuBarPopup, _ConsoleTopicsMixin ], {

        widgets : [ {
            name : 'alfresco/header/AlfMenuItem',
            config : {
                iconClass : 'alf-loading-icon',
                label : 'loading.label'
            }
        } ],

        constructor : function jsconsole_menu_CheckableBackendMenuBarPopup__constructor()
        {
            this._discoveredBackends = [];
            this._recentlyDiscoveredBackends = [];
            this._firstItems = true;
        },

        postCreate : function jsconsole_menu_CheckableBackendMenuBarPopup__postCreate()
        {
            this.inherited(arguments);

            this.alfSubscribe(this.discoverBackendsTopic + '_SUCCESS', lang.hitch(this, this.onBackendDiscoveryResponse));
        },

        onBackendDiscoveryResponse : function jsconsole_menu_CheckableBackendMenuBarPopup__onBackendDiscoveryResponse(payload)
        {
            var backendDefinition;
            if (payload !== undefined && payload !== null && lang.isString(payload.backend))
            {
                backendDefinition = this.alfCleanFrameworkAttributes(payload);
                backendDefinition.isDefault = this._discoveredBackends.length === 0;
                this._discoveredBackends.push(backendDefinition);
                this._recentlyDiscoveredBackends.push(backendDefinition);

                functionUtils.debounce({
                    name : 'jsconsole/menu/CheckableBackendMenuBarPopup-delayedMenuItemAddition',
                    timeoutMs : 150,
                    func : lang.hitch(this, this._delayedMenuItemAddition)
                });
            }
        },

        _delayedMenuItemAddition : function jsconsole_menu_CheckableBackendMenuBarPopup___delayedMenuItemAddition()
        {
            var menuItemWidgets = [], cachedLabels = {};

            array.forEach(this._recentlyDiscoveredBackends,
                    function jsconsole_menu_CheckableBackendMenuBarPopup___delayedMenuItemAddition_setupBackendMenuItem(backendDefinition)
                    {
                        var widget = {
                            name : 'alfresco/menus/AlfCheckableMenuItem',
                            config : {
                                label : backendDefinition.label,
                                title : backendDefinition.description,
                                group : this.id,
                                value : backendDefinition.backend,
                                checked : backendDefinition.isDefault,
                                publishTopic : this.toggleActiveBackendTopic,
                                publishPayload : {
                                    backend : backendDefinition.backend
                                }
                            }
                        };

                        menuItemWidgets.push(widget);
                    }, this);

            if (menuItemWidgets.length > 0)
            {
                menuItemWidgets.sort(lang.hitch(this, function jsconsole_menu_CheckableBackendMenuBarPopup___delayedMenuItemAddition_sort(
                        a, b)
                {
                    var labelA, labelB;

                    labelA = cachedLabels[a.config.label] || this.message(a.config.label);
                    cachedLabels[a.config.label] = labelA;

                    labelB = cachedLabels[b.config.label] || this.message(b.config.label);
                    cachedLabels[b.config.label] = labelB;

                    return labelA.localeCompare(labelB);
                }));

                if (this._firstItems === true)
                {
                    array.forEach(this.popup.getChildren(),
                            function jsconsole_menu_CheckableBackendMenuBarPopup___delayedMenuItemAddition_removeDummy(widget, index)
                            {
                                this.popup.removeChild(widget);
                            }, this);
                }

                this.processWidgets(menuItemWidgets, undefined, 'delayedMenuItemAddition');

                this._firstItems = false;
            }

            // reset
            this._recentlyDiscoveredBackends = [];
        },

        allWidgetsProcessed : function jsconsole_menu_CheckableBackendMenuBarPopup__allWidgetsProcessed(processedWidgets, processWidgetsId)
        {
            if (processWidgetsId === 'delayedMenuItemAddition')
            {
                array.forEach(processedWidgets, function jsconsole_menu_CheckableBackendMenuBarPopup__allWidgetsProcessed_addItem(widget)
                {
                    this.popup.addChild(widget);
                }, this);
            }
            else
            {
                this.inherited(arguments);
            }
        }
    });
});