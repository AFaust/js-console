/**
 * This module defines a basic CodeMirror-backed editor for use in the JavaScript Console addon. It is partially based on the prototypical
 * alfresco/forms/controls/CodeMirrorEditor but since we don't need a form control it has no support fo it.
 * 
 * @module jsconsole/editor/JavaScriptEditor
 * @extends jsconsole/editor/CodeMirrorEditor
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', './CodeMirrorEditor', 'cm/lib/codemirror', 'dojo/_base/lang', '../tern/lib/tern',
        'cm/mode/javascript/javascript', 'cm/addon/lint/lint', 'cm/addon/lint/javascript-lint', 'cm/addon/edit/matchbrackets',
        'cm/addon/edit/closebrackets', 'cm/addon/hint/show-hint', 'cm/addon/tern/tern', '../tern/lib/def', '../tern/lib/comment' ],
        function(declare, CodeMirrorEditor, CodeMirror, lang, tern)
        {
            return declare([ CodeMirrorEditor ], {

                cssRequirements : [ {
                    cssFile : 'cm/addon/lint/lint.css'
                }, {
                    cssFile : 'cm/addon/hint/show-hint.css'
                }, {
                    cssFile : 'cm/addon/tern/tern.css'
                } ],

                mode : 'javascript',

                buildEditorConfig : function jsconsole_editors_JavaScriptEditor__buildEditorConfig()
                {
                    var editorConfig, mac, ctrl;

                    editorConfig = this.inherited(arguments);

                    editorConfig.gutters = editorConfig.gutters || [];
                    editorConfig.gutters.push('CodeMirror-lint-markers');
                    editorConfig.lint = true;
                    editorConfig.matchBrackets = true;
                    editorConfig.autoCloseBrackets = true;

                    mac = CodeMirror.keyMap['default'] === CodeMirror.keyMap.macDefault;
                    ctrl = mac ? 'Cmd-' : 'Ctrl-';

                    editorConfig.extraKeys = {
                        '.' : lang.hitch(this, this.editorKeyOnDot)
                    };

                    editorConfig.extraKeys[ctrl + 'I'] = lang.hitch(this, this.editorKeyOnCtrlI);
                    editorConfig.extraKeys[ctrl + 'Space'] = 'autocomplete';
                    editorConfig.extraKeys[ctrl + 'Enter'] = lang.hitch(this, this.editorKeyOnCtrlEnter);
                    editorConfig.extraKeys['Shift-' + ctrl + 'F'] = lang.hitch(this, this.editorKeyOnCtrlShiftF);
                    // doesn't work (though it is included in Sublime key bindings too)
                    editorConfig.extraKeys[ctrl + '/'] = lang.hitch(this, this.editorKeyOnCtrlSlash);
                    // alternate
                    editorConfig.extraKeys['Shift-' + ctrl + 'C'] = lang.hitch(this, this.editorKeyOnCtrlSlash);

                    return editorConfig;
                },

                setupEditor : function jsconsole_editors_JavaScriptEditor__setupEditor()
                {
                    this.inherited(arguments);

                    // unfortunately despite supporting various module systems, CodeMirror.TernServer still expects tern to be a global
                    // variable
                    window.tern = tern;

                    this.ternServer = new CodeMirror.TernServer({
                        defs : []
                    });
                },

                editorKeyOnDot : function jsconsole_editors_JavaScriptEditor__editorKeyOnDot(cm)
                {
                    setTimeout(function jsconsole_editors_JavaScriptEditor__editorKeyOnDot_delayedAutoComplete()
                    {
                        cm.execCommand('autocomplete');
                    }, 50);
                    return CodeMirror.Pass;
                },

                editorKeyOnCtrlI : function jsconsole_editors_JavaScriptEditor__editorKeyOnCtrlI(cm)
                {
                    this.ternServer.showType(cm);
                },

                editorKeyOnCtrlEnter : function jsconsole_editors_JavaScriptEditor__editorKeyOnCtrlEnter(cm)
                {
                    return CodeMirror.Pass;
                },

                editorKeyOnCtrlSlash : function jsconsole_editors_JavaScriptEditor__editorKeyOnCtrlSlash(cm)
                {
                    var selectedCode, lineNo, line;

                    if (cm.somethingSelected())
                    {
                        selectedCode = cm.getSelection();
                        if (selectedCode.substring(0, 2) === '//')
                        {
                            selectedCode = selectedCode.replace(/^\/\/\s?/gm, '');
                        }
                        else
                        {
                            selectedCode = selectedCode.replace(/^/gm, '// ');
                        }
                        cm.replaceSelection(selectedCode);
                    }
                    else
                    {
                        lineNo = cm.getCursor().line;
                        line = cm.getLine(lineNo);
                        if (line.substring(0, 3) === '// ')
                        {
                            cm.replaceRange('', {
                                line : lineNo,
                                ch : 0
                            }, {
                                line : lineNo,
                                ch : 3
                            });
                        }
                        else if (line.substring(0, 2) === '//')
                        {
                            cm.replaceRange('', {
                                line : lineNo,
                                ch : 0
                            }, {
                                line : lineNo,
                                ch : 2
                            });
                        }
                        else
                        {
                            cm.replaceRange('// ', {
                                line : lineNo,
                                ch : 0
                            });
                        }

                    }
                },

                editorKeyOnCtrlShiftF : function jsconsole_editors_JavaScriptEditor__editorKeyOnCtrlShiftF(cm)
                {
                    return CodeMirror.Pass;
                }

            });
        });