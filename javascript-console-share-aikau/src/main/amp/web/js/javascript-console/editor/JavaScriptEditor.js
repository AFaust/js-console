/**
 * This module defines a basic CodeMirror-backed editor for use in the JavaScript Console addon. It is partially based on the prototypical
 * alfresco/forms/controls/CodeMirrorEditor but since we don't need a form control it has no support fo it.
 * 
 * @module jsconsole/editor/JavaScriptEditor
 * @extends jsconsole/editor/CodeMirrorEditor
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', './CodeMirrorEditor', 'cm/lib/codemirror', 'dojo/_base/lang', 'dojo/_base/array', '../tern/lib/tern',
        'cm/mode/javascript/javascript', 'cm/addon/lint/lint', 'cm/addon/lint/javascript-lint', 'cm/addon/edit/matchbrackets',
        'cm/addon/edit/closebrackets', 'cm/addon/hint/show-hint', 'cm/addon/tern/tern', '../tern/lib/def', '../tern/lib/comment' ],
        function(declare, CodeMirrorEditor, CodeMirror, lang, array, tern)
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

                typeDefinitionsLoadedTopic : null,

                constructor : function jsconsole_editors_JavaScriptEditor__constructor()
                {
                    this._typeDefinitionsByBackend = {};
                },

                postCreate : function jsconsole_editor_JavaScriptEditor__postCreate()
                {
                    this.inherited(arguments);

                    this.alfSubscribe(this.typeDefinitionsLoadedTopic, lang.hitch(this, this.onTypeDefinitionAnnouncement));
                },

                onTypeDefinitionAnnouncement : function jsconsole_editor_JavaScriptEditor__onTypeDefinitionAnnouncement(payload)
                {
                    var backend, additive, typeDefinitions, newTypeDefinitions;

                    backend = lang.getObject('backend', false, payload);
                    additive = lang.getObject('additive', false, payload);
                    typeDefinitions = lang.getObject('javaScriptTypeDefinitions', false, payload);

                    if (lang.isString(backend) && lang.isArray(typeDefinitions))
                    {
                        if (additive !== true && this.ternServer !== undefined && this.ternServer !== null
                                && lang.isString(this._currentBackend) && backend === this._currentBackend
                                && this._typeDefinitionsByBackend.hasOwnProperty(backend))
                        {
                            array.forEach(this._typeDefinitionsByBackend[backend],
                                    function jsconsole_editor_JavaScriptEditor__onTypeDefinitionAnnouncement_removeTypeDef(def)
                                    {
                                        if (def !== null && lang.isObject(def) && def.hasOwnProperty('!name')
                                                && lang.isString(def['!name']))
                                        {
                                            // CodeMirror.TernServer provides no public API so we have to access internal server
                                            // directly
                                            this.ternServer.server.deleteDefs(def['!name']);
                                        }
                                    }, this);
                        }

                        // completely decouple to avoid co-modification
                        newTypeDefinitions = JSON.parse(JSON.stringify(typeDefinitions));
                        if (additive === true)
                        {
                            this._typeDefinitionsByBackend[backend] = (this._typeDefinitionsByBackend[backend] || [])
                                    .concat(newTypeDefinitions);
                        }
                        else
                        {
                            this._typeDefinitionsByBackend[backend] = newTypeDefinitions;
                        }

                        if (this.ternServer !== undefined && this.ternServer !== null && lang.isString(this._currentBackend)
                                && backend === this._currentBackend)
                        {
                            array.forEach(newTypeDefinitions,
                                    function jsconsole_editor_JavaScriptEditor__onTypeDefinitionAnnouncement_addTypeDef(def)
                                    {
                                        if (def !== null && lang.isObject(def) && def.hasOwnProperty('!name')
                                                && lang.isString(def['!name']))
                                        {
                                            // CodeMirror.TernServer provides no public API so we have to access internal server
                                            // directly
                                            this.ternServer.server.addDefs(def);
                                        }
                                    }, this);
                        }
                    }
                },

                onToggleActiveBackendRequest : function jsconsole_editors_JavaScriptEditor__onToggleActiveBackendRequest(payload)
                {
                    var backend;

                    if (this.ternServer !== undefined && this.ternServer !== null)
                    {
                        backend = lang.getObject('backend', false, payload);

                        if (lang.isString(this._currentBackend) && lang.isString(backend) && backend !== this._currentBackend)
                        {
                            if (this._typeDefinitionsByBackend.hasOwnProperty(this._currentBackend))
                            {
                                array.forEach(this._typeDefinitionsByBackend[this._currentBackend],
                                        function jsconsole_editors_JavaScriptEditor__onToggleActiveBackendRequest_removeTypeDef(def)
                                        {
                                            if (def !== null && lang.isObject(def) && def.hasOwnProperty('!name')
                                                    && lang.isString(def['!name']))
                                            {
                                                // CodeMirror.TernServer provides no public API so we have to access internal server
                                                // directly
                                                this.ternServer.server.deleteDefs(def['!name']);
                                            }
                                        }, this);
                            }

                            this.inherited(arguments);

                            if (this._typeDefinitionsByBackend.hasOwnProperty(this._currentBackend))
                            {
                                array.forEach(this._typeDefinitionsByBackend[this._currentBackend],
                                        function jsconsole_editors_JavaScriptEditor__onToggleActiveBackendRequest_addTypeDef(def)
                                        {
                                            if (def !== null && lang.isObject(def) && def.hasOwnProperty('!name')
                                                    && lang.isString(def['!name']))
                                            {
                                                // CodeMirror.TernServer provides no public API so we have to access internal server
                                                // directly
                                                this.ternServer.server.addDefs(def);
                                            }
                                        }, this);
                            }
                        }
                        else
                        {
                            this.inherited(arguments);
                        }
                    }
                    else
                    {
                        this.inherited(arguments);
                    }
                },

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
                    editorConfig.extraKeys[ctrl + 'Space'] = lang.hitch(this, this.editorKeyOnCtrlSpace);
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
                    var options;

                    this.inherited(arguments);

                    // unfortunately despite supporting various module systems, CodeMirror.TernServer still expects tern to be a global
                    // variable
                    if (!window.tern)
                    {
                        window.tern = tern;
                    }

                    options = {
                        defs : []
                    };

                    if (lang.isString(this._currentBackend) && this._typeDefinitionsByBackend.hasOwnProperty(this._currentBackend))
                    {
                        array.forEach(this._typeDefinitionsByBackend[this._currentBackend],
                                function jsconsole_editors_JavaScriptEditor__setupEditor_addTypeDef(def)
                                {
                                    if (def !== null && lang.isObject(def) && def.hasOwnProperty('!name') && lang.isString(def['!name']))
                                    {
                                        options.defs.push(def);
                                    }
                                }, this);
                    }

                    this.ternServer = new CodeMirror.TernServer(options);
                },

                editorKeyOnDot : function jsconsole_editors_JavaScriptEditor__editorKeyOnDot(cm)
                {
                    setTimeout(lang.hitch(this, this.editorKeyOnCtrlSpace, cm), 50);
                    return CodeMirror.Pass;
                },
                
                editorKeyOnCtrlSpace : function jsconsole_editors_JavaScriptEditor__editorKeyOnCtrlSpace(cm)
                {
                    this.ternServer.complete(cm);
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