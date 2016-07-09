/**
 * This module defines a basic CodeMirror-backed editor for use in the JavaScript Console addon. It is partially based on the prototypical
 * alfresco/forms/controls/CodeMirrorEditor but since we don't need a form control it has no support fo it.
 * 
 * @module jsconsole/editors/JavaScriptEditor
 * @extends jsconsole/editors/CodeMirrorEditor
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'jsconsole/editors/CodeMirrorEditor', 'cm/mode/javascript/javascript', 'cm/addon/lint/lint',
        'cm/addon/lint/javascript-lint', 'cm/addon/edit/matchbrackets', 'cm/addon/edit/closebrackets', 'cm/addon/hint/show-hint' ],
        function(declare, CodeMirrorEditor)
        {
            return declare([ CodeMirrorEditor ], {

                cssRequirements : [ {
                    cssFile : 'cm/addon/lint/lint.css'
                }, {
                    cssFile : 'cm/addon/hint/show-hint.css'
                } ],

                mode : 'javascript',

                buildEditorConfig : function jsconsole_editors_JavaScriptEditor__buildEditorConfig()
                {
                    var editorConfig = this.inherited(arguments);

                    editorConfig.gutters = editorConfig.gutters || [];
                    editorConfig.gutters.push('CodeMirror-lint-markers');
                    editorConfig.lint = true;
                    editorConfig.matchBrackets = true;
                    editorConfig.autoCloseBrackets = true;

                    return editorConfig;
                }

            });
        });