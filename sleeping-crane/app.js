(function() {



  let renderPage = function() { 
    let divView = document.querySelector("#reader > #mask > .view");
    if (divView != null) {
      let canvasNodes = divView.querySelectorAll("canvas");
      if (canvasNodes.length > 0) { 
        let width = canvasNodes[0].width;
        let height = canvasNodes[0].height;
        let bytes = new Uint8ClampedArray(width * height * 4);
        let iframe = document.createElement("iframe");
        document.body.appendChild(iframe);
        let worker_canvas = iframe.contentDocument.createElement("canvas");
        let worker_ctx = worker_canvas.getContext("2d");
        for(let i = 0; i < canvasNodes.length; i++) { 
          let ctx = canvasNodes[i].getContext("2d");
          let imageData = worker_ctx.getImageData.apply(ctx, [0,0,width,height]);
          let data = imageData.data;
          for(let j = 0; j < bytes.length; j+=4) { 
            if (data[j+3] === 255) { 
              bytes[j] = data[j];
              bytes[j+1] = data[j+1];
              bytes[j+2] = data[j+2];
              bytes[j+3] = 255;
            }
          }
        }
        document.body.removeChild(iframe);
        return bytes;
        // worker_canvas.width = width;
        // worker_canvas.height = height;
        // let worker_imageData = worker_ctx.createImageData(width, height);
        // for(let i = 0; i < bytes.length; i++) { 
        //   worker_imageData.data[i] = bytes[i];
        // }
        // worker_ctx.putImageData(worker_imageData, 0 ,0);
        // worker_canvas.toDataURL();
      }
    }
    return null;
  };

  //console.log(renderPage());
  let btnRight = document.querySelector("body > button.right");
  let modal = document.querySelector("body > div.modal-container");
  let modalClose = modal.querySelector(".modal-close");
  let count = document.querySelectorAll("#thumbnails-list > li").length;

  let UI = function() { 
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

  let ui = new UI();
  ui.show();

  let x = 0;
  var interval = setInterval(function() { ui.setProgress(x++/100); }, 100);

ui.onclick(function(){
  clearInterval(interval);
  ui.hide();
});


  // let max = 0;
  // let loop = function() { 
  //   console.log("render page");
  //   btnRight.click();
  //   console.log("btn clicked");
  //   if (modal.style.display === "block") {
  //     console.log("last page reached");
  //     modalClose.click();
  //   }
  //   else if (30 < max++) {
  //     console.log("reached max count");
  //   }
  //   else {
  //     setTimeout(loop, 5000);
  //   }
  // };

  // loop();

})();
