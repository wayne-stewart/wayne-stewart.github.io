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

  let max = 0;
  let loop = function() { 
    console.log("render page");
    btnRight.click();
    console.log("btn clicked");
    if (modal.style.display === "block") {
      console.log("last page reached");
      modalClose.click();
    }
    else if (30 < max++) {
      console.log("reached max count");
    }
    else {
      setTimeout(loop, 5000);
    }
  };

  loop();

})();
