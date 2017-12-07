(function(ns){

    ns.Nav = function() {
        let btnRight = document.querySelector("body > button.right");
        let modal = document.querySelector("body > div.modal-container");
        let modalClose = modal.querySelector(".modal-close");
        
        //let browse = document.getElementById("browse-btn");

        this.goToFirstPage = function() {
            let thumbnails = document.querySelectorAll("#thumbnails-list > li");
            setTimeout(function(){ thumbnails[0].querySelector("figure").click(); }, 1);
            
        };
    };

})(window.SleepingCrane || (window.SleepingCrane = new Object()));