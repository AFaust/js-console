/**
 * This module defines a basic CodeMirror-backed editor for use in the JavaScript Console addon. It is partially based on the prototypical
 * alfresco/forms/controls/CodeMirrorEditor but since we don't need a form control it has no support fo it.
 * 
 * @module jsconsole/editors/CodeMirrorEditor
 * @extends module:dijit/_WidgetBase
 * @mixes module:dijit/_TemplatedMixin
 * @mixes module:alfresco/core/Core
 * @mixes module:alfresco/core/ResizeMixin
 * @mixes module:jsconsole/_ConsoleTopicsMixin
 * @author Axel Faust
 */
define([ 'dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'alfresco/core/Core', 'alfresco/core/ResizeMixin',
        'jsconsole/_ConsoleTopicsMixin', 'dojo/text!./templates/CodeMirrorEditor.html', 'dojo/_base/lang', 'dojo/_base/array',
        'cm/lib/codemirror', 'cm/addon/display/placeholder', 'cm/addon/display/fullscreen', 'cm/addon/display/rulers',
        'cm/addon/dialog/dialog', 'cm/addon/edit/trailingspace', 'cm/addon/comment/comment', 'cm/addon/fold/foldcode',
        'cm/addon/selection/active-line', 'cm/addon/selection/mark-selection', 'cm/addon/search/match-highlighter',
        'cm/addon/search/searchcursor', 'cm/addon/search/search' ], function(declare, _Widget, _Templated, Core, ResizeMixin,
        _ConsoleTopicsMixin, template, lang, array, CodeMirror)
{
    return declare([ _Widget, _Templated, Core, ResizeMixin, _ConsoleTopicsMixin ], {

        templateString : template,

        cssRequirements : [ {
            cssFile : 'cm/lib/codemirror.css'
        }, {
            cssFile : 'cm/addon/search/match-highlighter.css'
        },
        // themes
        {
            cssFile : 'cm/theme/3024day.css'
        }, {
            cssFile : 'cm/theme/3024night.css'
        }, {
            cssFile : 'cm/theme/ambiance-mobile.css'
        }, {
            cssFile : 'cm/theme/ambiance.css'
        }, {
            cssFile : 'cm/theme/base16-dark.css'
        }, {
            cssFile : 'cm/theme/base16-light.css'
        }, {
            cssFile : 'cm/theme/blackboard.css'
        }, {
            cssFile : 'cm/theme/cobalt.css'
        }, {
            cssFile : 'cm/theme/eclipse.css'
        }, {
            cssFile : 'cm/theme/elegant.css'
        }, {
            cssFile : 'cm/theme/erlang-dark.css'
        }, {
            cssFile : 'cm/theme/lesser-dark.css'
        }, {
            cssFile : 'cm/theme/mbo.css'
        }, {
            cssFile : 'cm/theme/mdn-like.css'
        }, {
            cssFile : 'cm/theme/midnight.css'
        }, {
            cssFile : 'cm/theme/monokai.css'
        }, {
            cssFile : 'cm/theme/neat.css'
        }, {
            cssFile : 'cm/theme/neo.css'
        }, {
            cssFile : 'cm/theme/night.css'
        }, {
            cssFile : 'cm/theme/neat.css'
        }, {
            cssFile : 'cm/theme/paraiso-dark.css'
        }, {
            cssFile : 'cm/theme/paraiso-light.css'
        }, {
            cssFile : 'cm/theme/pastel-on-dark.css'
        }, {
            cssFile : 'cm/theme/rubyblue.css'
        }, {
            cssFile : 'cm/theme/solarized.css'
        }, {
            cssFile : 'cm/theme/the-matrix.css'
        }, {
            cssFile : 'cm/theme/tomorrow-night-eighties.css'
        }, {
            cssFile : 'cm/theme/twilight.css'
        }, {
            cssFile : 'cm/theme/vibrant-link.css'
        }, {
            cssFile : 'cm/theme/xq-dark.css'
        }, {
            cssFile : 'cm/theme/xq-light.css'
        }, {
            cssFile : './css/CodeMirrorEditor.css'
        } ],

        mode : null,

        theme : null,

        placeholder : null,

        autofocus : true,

        lineNumbers : true,

        lineWrapping : true,

        readOnly : false,

        updateContentTopic : null,

        clearContentTopic : null,

        appendContentTopic : null,

        contentUpdatedTopic : null,

        constructor : function jsconsole_editors_CodeMirrorEditor__constructor()
        {
            this._docsByBackend = {};
        },

        postCreate : function jsconsole_editors_CodeMirrorEditor__postCreate()
        {
            var reqs;

            this.inherited(arguments);

            if (lang.isString(this.editMode))
            {
                // ensure the extensions to CodeMirror are loaded
                reqs = [];

                if (lang.isString(this.editMode))
                {
                    reqs.push('cm/mode/' + this.editMode + '/' + this.editMode);
                }

                require(reqs, lang.hitch(this, this.setupEditor));
            }
            else
            {
                this.setupEditor();
            }

            this.alfSubscribe(this.toggleActiveBackendTopic, lang.hitch(this, this.onToggleActiveBackendRequest));

            if (lang.isString(this.updateContentTopic))
            {
                this.alfSubscribe(this.updateContentTopic, lang.hitch(this, this.onEditorContentUpdateRequest));
            }

            if (lang.isString(this.clearContentTopic))
            {
                this.alfSubscribe(this.clearContentTopic, lang.hitch(this, this.onEditorContentClearRequest));
            }

            if (lang.isString(this.appendContentTopic))
            {
                this.alfSubscribe(this.appendContentTopic, lang.hitch(this, this.onEditorContentAppendRequest));
            }

            this.alfSetupResizeSubscriptions(this.onResizeEvent, this);
        },

        buildEditorConfig : function jsconsole_editors_CodeMirrorEditor__buildEditorConfig()
        {
            var editorConfig = {
                autofocus : true,
                lineNumbers : true,
                lineWrapping : true,
                showCursorWhenSelecting : true,
                styleActiveLine : true,
                showTrailingSpace : true,
                tabSize : 4,
                indentUnit : 4,
                indentWithTabs : false
            };

            // not all props need necessarily be settable externally, but these are
            array.forEach([ 'mode', 'theme', 'placeholder', 'autofocus', 'lineNumbers', 'lineWrapper', 'readOnly' ], function(prop)
            {
                if (this[prop] !== undefined && this[prop] !== null)
                {
                    editorConfig[prop] = this[prop];
                }
            }, this);

            return editorConfig;
        },

        setupEditor : function jsconsole_editors_CodeMirrorEditor__setupEditor()
        {
            var editorConfig = this.buildEditorConfig();

            this.editor = CodeMirror.fromTextArea(this.editorNode, editorConfig);
            this.editor.on('change', lang.hitch(this, this.onEditorChange));
            this.editor.setSize(null, '100%');

            if (lang.isString(this._lazyContent))
            {
                this.editor.setValue(content);
                delete this._lazyContent;
            }
        },

        setEditorContent : function jsconsole_editors_CodeMirrorEditor__setEditorContent(content)
        {
            if (lang.isString(content))
            {
                if (this.editor !== undefined && this.editor !== null)
                {
                    if (this.editor.getValue() !== content)
                    {
                        this.editor.setValue(content);
                    }
                }
                else
                {
                    this._lazyContent = content;
                }
            }
        },

        onEditorContentUpdateRequest : function jsconsole_editors_CodeMirrorEditor__onEditorContentUpdateRequest(payload)
        {
            var content = lang.getObject('content', false, payload);
            this.setEditorContent(content);
        },

        onEditorContentClearRequest : function jsconsole_editors_CodeMirrorEditor__onEditorContentClearRequest(payload)
        {
            this.setEditorContent('');
        },

        onEditorContentAppendRequest : function jsconsole_editors_CodeMirrorEditor__onEditorContentAppendRequest(payload)
        {
            var content, lastLineNo, lastLine, lastCh;

            content = lang.getObject('content', false, payload);

            if (lang.isString(content))
            {
                if (this.editor !== undefined && this.editor !== null)
                {
                    lastLineNo = this.editor.lastLine();
                    lastLine = this.editor.getLine(lastLineNo);
                    lastCh = lastLine.length;

                    this.editor.replaceRange((lastCh !== 0 ? '\n' : '') + content, {
                        line : lastLineNo,
                        ch : lastCh
                    })
                }
                else if (lang.isString(this._lazyContent))
                {
                    this._lazyContent += '\n' + content;
                }
            }
        },

        onEditorChange : function jsconsole_editors_CodeMirrorEditor__onEditorChange(editor, changeObject)
        {
            var content, selectedContent;

            if (lang.isString(this.contentUpdatedTopic))
            {
                content = this.editor.getValue()
                selectedContent = this.editor.somethingSelected() ? this.editor.getSelection() : null;
                this.alfPublish(this.contentUpdatedTopic, {
                    content : content,
                    selectedContent : selectedContent
                });
            }
        },

        onToggleActiveBackendRequest : function jsconsole_editors_CodeMirrorEditor__onToggleActiveBackendRequest(payload)
        {
            var backend, oldDoc, newDoc;

            backend = lang.getObject('backend', false, payload);

            if (lang.isString(backend))
            {
                if (this.editor !== undefined && this.editor !== null && lang.isString(this._currentBackend))
                {
                    if (this._docsByBackend.hasOwnProperty(backend))
                    {
                        newDoc = this._docsByBackend[backend];
                    }
                    else
                    {
                        newDoc = new CodeMirror.Doc('', this.mode, 0);
                        this._docsByBackend[backend] = newDoc;
                    }

                    oldDoc = this.editor.swapDoc(newDoc);
                    if (!this._docsByBackend.hasOwnProperty(this._currentBackend))
                    {
                        this._docsByBackend[this._currentBackend] = oldDoc;
                    }
                }
                this._currentBackend = backend;
            }
        },

        onResizeEvent : function jsconsole_editors_CodeMirrorEditor__onResizeEvent()
        {
            if (this.editor !== undefined && this.editor !== null)
            {
                this.editor.refresh();
            }
        }

    });
});