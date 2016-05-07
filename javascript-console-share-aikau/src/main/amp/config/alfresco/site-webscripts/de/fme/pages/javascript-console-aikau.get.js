model.jsonModel = {
    services : [ 'jsconsole/backend/LegacyRepositoryConsoleBackend' ],
    widgets : [ {
        // TODO Report issue to Aikau team
        // initialization order can result in SetTitle firing pubSub before Title is subscribed
        id : 'SET_PAGE_TITLE',
        name : 'alfresco/header/SetTitle',
        config : {
            title : 'tool.javascript-console-aikau.label'
        }
    }, {
        name : 'jsconsole/tool/JavaScriptConsoleTool',
        config : {}
    } ]
};