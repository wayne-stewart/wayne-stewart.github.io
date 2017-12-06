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

    load("https://wayne-stewart.github.io/sleeping-crane/lib/blob.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/canvas-to-blob.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/filesaver.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/jspdf.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/jszip.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/app.js");
    load("https://wayne-stewart.github.io/sleeping-crane/ui.js");
})();

