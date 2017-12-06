(function(){
    let loading = [];
    
    let load = function(src) { 
        let el = document.createElement("script");
        el.src = src + "?" + (new Date()).getTime();
        loading.push(el);
        el.onload = function() {
            let i = loading.indexOf(el);
            if (i === loading.length - 1) {
                loading.pop();
            } 
            else {
                loading[i] = loading[loading.length - 1];
                loading.pop();
            }
            if (loading.length === 0) {
                onLoaded();
            }
        };
        document.body.appendChild(el);
    };

    let onLoaded = function() { 
        SleepingCrane.start();
    };

    load("./blob.js");
    load("./canvas-to-blob.js");
    load("./filesaver.min.js");
    load("./jspdf.min.js");
    load("./jszip.min.js");
    load("./app.js");
    load("./ui.js");
})();

