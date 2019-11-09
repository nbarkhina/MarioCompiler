requirejs.config({
    paths: {
        "vs": "../node_modules/monaco-editor/min/vs",
    },
    urlArgs: function (id, url) {
        var rando = Math.floor(Math.random() * Math.floor(100000));
        var args = '';
        args = '?v=' + rando;
        return args;
    }
});
require(["index"], function () {
});
//# sourceMappingURL=config.js.map