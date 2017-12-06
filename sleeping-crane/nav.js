(function(ns){

    ns.Nav = function() {
        let btnRight = document.querySelector("body > button.right");
        let modal = document.querySelector("body > div.modal-container");
        let modalClose = modal.querySelector(".modal-close");
        let thumbnails = document.querySelectorAll("#thumbnails-list > li");

        this.goToFirstPage = function() {
            thumbnails[i].click();
        };
    };

})(window.SleepingCrane || (window.SleepingCrane = new Object()));