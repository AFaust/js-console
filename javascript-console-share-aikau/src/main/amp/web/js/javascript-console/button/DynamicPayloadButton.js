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

        setupPayloadSubscriptions : function jsconsole_button_DynamicPayloadButton__setupPayloadSubscriptions(pps)
        {
            if (pps.topic)
            {
                if (lang.isString(pps.pubSubScope) && pps.pubSubScope !== '')
                {
                    this.alfSubscribe(pps.pubSubScope + pps.topic, lang.hitch(this, this.onPayloadUpdate, pps.dataMapping), true);
                }
                else
                {
                    this.alfSubscribe(pps.topic, lang.hitch(this, this.onPayloadUpdate, pps.dataMapping), pps.subscribeGlobal,
                            pps.subscribeParent);
                }
            }
            else
            {
                this.alfLog('warn', 'A publishPayloadSubscription is configured without a \'topic\' attribute', pps, this);
            }
        }

    });
});