/**
 * This extension of the dynamic payload button exists solely to address the current limiation that the base button can't subscribe to
 * topics of different scopes for payload mapping.
 * 
 * @module jsconsole/button/DynamicPayloadButton
 * @extends module:alfresco/buttons/AlfDynamicPayloadButton
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'alfresco/buttons/AlfDynamicPayloadButton', 'dojo/_base/lang' ], function(declare, AlfDynamicPayloadButton,
        lang)
{
    return declare([ AlfDynamicPayloadButton ], {

        // TODO Report bug to Aikau: null-values (value reset) or other non-truthy values aren't mapped
        mapData : function jsconsole_button_DynamicPayloadButton__mapData(dataMapping, data)
        {
            Object.keys(dataMapping).forEach(function jsconsole_button_DynamicPayloadButton__mapData_forEachKey(key)
            {
                var value;
                if (lang.exists(key, data))
                {
                    value = lang.getObject(key, false, data);
                    lang.setObject(dataMapping[key], value, this.publishPayload);
                }
            }, this);
        }

    });
});