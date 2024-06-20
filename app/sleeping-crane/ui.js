
(function(ns){
    ns.UI = function() { 
        let ui = document.createElement("div");
    
        ui.style.display = "block";
        ui.style.width = "300px";
        ui.style.height = "40px";
        ui.style.backgroundColor = "lightgrey";
        ui.style.position = "absolute";
        ui.style.zIndex = 3000;
        ui.style.borderRadius = "20px";
        ui.style.borderStyle = "solid";
        ui.style.borderWidth = "4px";
        ui.style.borderColor = "grey";
        ui.style.overflow = "hidden";
        let progress = document.createElement("div");
        progress.style.display = "block";
        progress.style.width = "0px";
        progress.style.height = "40px";
        progress.style.backgroundColor = "lightblue";
        ui.appendChild(progress);
        let label = document.createElement("label");
        label.style.position = "absolute";
        label.innerHTML = "Click to Cancel";
        ui.appendChild(label);
    
        this.show = function() {
            document.body.appendChild(ui);
            ui.style.top = (window.innerHeight / 2 - 50) + "px";
            ui.style.left = (window.innerWidth / 2 - 150) + "px";
            label.style.left = (ui.clientWidth / 2 - label.clientWidth / 2) + "px";
            label.style.top = (ui.clientHeight / 2 - label.clientHeight / 2) + "px";
        };
    
        this.hide = function() {
            document.body.removeChild(ui);
        };
    
        // should be a value between 0 and 1
        this.setProgress = function(value) { 
            if (value < 0) value = 0;
            if (value > 1) value = 1;
            progress.style.width = Math.ceil(300 * value) + "px";
        };
    
        this.onclick = function(fn) { 
            ui.addEventListener("click", fn);
        };
    };
})(window.SleepingCrane || (window.SleepingCrane = new Object()));