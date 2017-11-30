(function() {
  let iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  let worker_canvas = iframe.contentDocument.createElement("canvas");
  let worker_ctx = worker_canvas.getContext("2d");
  
  var divView = document.getElementsByClassName("view")[0];
  for(var i = 0; i < divView.childNodes.length; i++) { 
    console.log(divView.childNodes[i]);
  }
  
  document.body.removeChild(iframe);
})();
