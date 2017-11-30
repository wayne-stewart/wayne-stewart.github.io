(function() {
  let iframe = document.createElement("iframe");
  document.body.appendChild(iframe);
  let worker_canvas = iframe.contentDocument.createElement("canvas");
  let worker_ctx = worker_canvas.getContext("2d");
  let divView = document.querySelector("#reader > #mask > .view");
  if (divView != null) {
    let canvasNodes = divView.querySelectorAll("canvas");
    if (canvasNodes.length > 0) { 
      let width = canvasNodes[0].width;
      let height = canvasNodes[0].height;
      let bytes = new Uint8ClampedArray(width * height * 4);
      for(let i = 0; i < canvasNodes.length; i++) { 
        let ctx = canvasNodes[i].getContext("2d");
        let imageData = worker_ctx.getImageData.apply(ctx, [0,0,width,height]);
        for(let j = 0; j < bytes.length; j+=4) { 
          if (imageData.data[j+3] === 255) { 
            bytes[j] = imageData.data[j];
            bytes[j+1] = imageData.data[j+1];
            bytes[j+2] = imageData.data[j+2];
            bytes[j+3] = 255;
          }
        }
      }
      worker_canvas.width = width;
      worker_canvas.height = height;
      let worker_imageData = worker_ctx.createImageData(width, height);
      for(let i = 0; i < bytes.length; i++) { 
        worker_imageData.data[i] = bytes[i];
      }
      worker_ctx.putImageData(worker_imageData, 0 ,0);
      console.log(worker_canvas.toDataURL());
    }
  }
  document.body.removeChild(iframe);
})();
