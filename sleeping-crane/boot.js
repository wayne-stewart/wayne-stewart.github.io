(function(){
    let loading = 0;
    
    let load = function(src) { 
        let el = document.createElement("script");
        el.src = src + "?" + (new Date()).getTime();
        loading++;
        el.onload = function() {
            loading--;
            if (loading === 0) {
                setTimeout(SleepingCrane.start,1);
            }
        };
        document.body.appendChild(el);
    };

    load("https://wayne-stewart.github.io/sleeping-crane/lib/blob.js");
    //load("https://wayne-stewart.github.io/sleeping-crane/lib/canvas-to-blob.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/filesaver.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/jspdf.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/lib/jszip.min.js");
    load("https://wayne-stewart.github.io/sleeping-crane/app.js");
    load("https://wayne-stewart.github.io/sleeping-crane/ui.js");
    load("https://wayne-stewart.github.io/sleeping-crane/nav.js");
})();

