//Copyright 2015 Allisha M. Ali. All Rights Reserved.  
//No part of this application and code within, shall be replicated, 
//reproduced or modified in any way without expressed written consent.


var input,
    fileList,
    customImageName="",
    startIncrAt=0,
    files,
    numFiles=0,
    numImgPreviews=0,
    currentFileLoading=0,
    maxNumFiles = 20,
    maxFileSize = (5 * 1e6), //5MB
    outputFileType = "image/png",
    outputFileExt = "png", 
    imageSmoothingEnabled = true,
    thumbWidth = 0, 
    thumbHeight = 0,
    initialScale = 5,
    numUploads = 0,
    filesInZip = 0,
    totalBytesUploaded = 0, 
    lastThumbLoaded = false,
    cropCnvs, cropCxt, sessionID;

    function getDimensions(width, height, scale){
      scale = scale || 1;
      var imgWidth = width, imgHeight = height;
      var imgAspectRatio = width/height;
      var thumbAspectRatio = thumbWidth/thumbHeight;

      if(imgAspectRatio<1){
        //portrait image
        
        if(thumbAspectRatio<1){
          //portrait thumb

          if(imgAspectRatio>thumbAspectRatio){
            //skinny thumb
            height = thumbHeight;
            width = height*imgAspectRatio;
            
          }else{
            //skinny image
            width = thumbWidth;
            height = width/imgAspectRatio;
            
          }
          
        }else if(thumbAspectRatio>1){
          //landscape thumb
          width = thumbWidth;
          height = width/imgAspectRatio;
          
        }else{
          //square thumb
          width = thumbWidth;
          height = width/imgAspectRatio;
          
        }        

      }else if(imgAspectRatio>1){
        //landscape image
        
        if(thumbAspectRatio<1){
          //portrait thumb
          height = thumbHeight;
          width = height*imgAspectRatio;
        
        }else if(thumbAspectRatio>1){
          //landscape thumb

          if(imgAspectRatio<thumbAspectRatio){
            //skinny thumb
            width = thumbWidth;
            height = width/imgAspectRatio;
            
          }else{
            //skinny image
            height = thumbHeight;
            width = height*imgAspectRatio;
           
          }
          
        }else{
          //square thumb
          height = thumbHeight;
          width = height*imgAspectRatio;
          
        }

      }else{
        //square image i.e. aspectRatio = 1
        if(thumbAspectRatio>1){
          //landscape thumb
          width = thumbWidth;
          height = width/imgAspectRatio;
        
        }else if(thumbAspectRatio<1){
          //portrait thumb
          height = thumbHeight;
          width = height*imgAspectRatio;
         
        }else{
          //square thumb
          height = thumbHeight;
          width = thumbWidth;
         
        }
      }

      if((width*scale>imgWidth)||(height*scale>imgHeight)){
        width = imgWidth;
        height = imgHeight;
      }else{
        width = width * scale;
        height = height * scale;
      }
      

      var dimensions = {width:width, height:height};
      return dimensions;
    }

    function setCropArea(canvas){
      var imgWidth = canvas.attr('width'), 
      imgHeight = canvas.attr('height'),
      canvasWidth = cssValueToNumber(canvas.css('width')), 
      canvasHeight = cssValueToNumber(canvas.css('height')), 
      widthProportion = thumbWidth/canvasWidth,
      heightProportion = thumbHeight/canvasHeight,
      values = {
        cropWidth : Math.round(imgWidth * widthProportion),
        cropHeight : Math.round(imgHeight * heightProportion)
      }
      return values;
    }

    function cssValueToNumber(value){
      if(value != undefined){
        //first strip 'unit'
        value.replace("px","");
        value = parseInt(value);
      }

      return value;
    }


    function getContainmentValues(canvas, holder){
      var canvasWidth = cssValueToNumber(canvas.css('width')), 
      canvasHeight = cssValueToNumber(canvas.css('height')),
      topPos =  cssValueToNumber(canvas.css('top')),
      leftPos =  cssValueToNumber(canvas.css('left')),  
      offsetLeft = canvas.get(0).offsetLeft, 
      offsetTop = canvas.get(0).offsetTop; 

      if((topPos<0) || (leftPos<0)){
        offsetLeft = holder.get(0).offsetLeft; 
        offsetTop = holder.get(0).offsetTop;
      }

      var values = {
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        offsetLeft: offsetLeft,
        offsetTop: offsetTop,
        x1: Math.round(offsetLeft - (canvasWidth - thumbWidth)),
        y1: Math.round(offsetTop - (canvasHeight - thumbHeight)),
        x2: Math.round(offsetLeft),
        y2: Math.round(offsetTop)
      };

      //console.log(values);
      return values;
    }

    function setDraggable(canvas){

      var holder = canvas.parent(),
      canvasWidth = cssValueToNumber(canvas.css('width')), 
      canvasHeight = cssValueToNumber(canvas.css('height')), 
      axisScroll = false,
      cv = getContainmentValues(canvas, holder),
      containment = [cv.x1,cv.y1,cv.x2,cv.y2];

      if(!(canvasWidth>thumbWidth)){
        //width less than or equal to thumbWidth
        axisScroll="y"; //restrict x
      }

      if(!(canvasHeight>thumbHeight)){
          //height less than or equal to thumbHeight
          axisScroll="x"; //restrict y
      }

      if(!(canvasWidth>thumbWidth) && !(canvasHeight>thumbHeight)){
        axisScroll="xy";
      }

      if(axisScroll != "xy"){
        canvas.draggable({containment:containment, axis:axisScroll});
      }

      //Remove previous axisScroll classes
      holder.removeClass('axisScrollfalse axisScrollx axisScrolly axisScrollxy');
      holder.addClass('axisScroll' + axisScroll);      

    }

    function applyImageSmoothing(holder, resizeWidth, resizeHeight, index){
      var origCanvas = holder.find('canvas'),
      resizeCanvas = $('<canvas>');
      resizeCanvas.attr({
        'id': origCanvas.attr('id'),
        'height':resizeHeight,
        'width':resizeWidth
      }).on('imageSmoothingStart', function(evt){
        //console.log(evt);
      }).on('imageSmoothingComplete', function(evt){
        //console.log(evt);
        var attributes = origCanvas.get(0).attributes;
        
        $.each(attributes, function(i, val){
          //Does attribute exist?
          var attrName = val.name,
          attrVal = val.value;

          if((resizeCanvas.attr(attrName) === null) || (resizeCanvas.attr(attrName) === undefined)){
            resizeCanvas.attr(attrName,attrVal);
          }
        });

        origCanvas.remove();
        holder.append(this).addClass('smooth');
        setDraggable($(this));

        updateStatus("smooth");

        if($('.img_prev.smooth').length === $('.img_prev').length){
          $(document).trigger('allImagesSmoothed');
        }

      });
      
      canvasResize($(origCanvas).get(0),$(resizeCanvas).get(0));

    }

    function allImagesSmoothed(evt){
      console.log(evt.type);
      $('#download .status').show().find('.process').text('Smoothing complete for');
      $('#loadStatus').removeClass('active').find('p').text('');
      $('#imagePreviews').removeClass('smoothing').addClass('smoothened');
      $('#btnDwnldThumbs').show();
      $('#download .prompt.downloading').hide();
      $('#download .prompt.predownload').show();
    }
    
    function smoothAllImages(){
      //$('#loadStatus').addClass('active').find('p').text('smoothing...');
      $('#btnDwnldThumbs, #download .smoothing').hide();
      $('#download .prompt.downloading').show();
      $('#download .prompt.predownload').hide();
      $('#download .status').show().find('.process').text('Smoothing');
      $('#imagePreviews').addClass('smoothing');


      $.each($('.img_prev'), function(i, val){
        if(!$(val).hasClass('smooth')){
          var thumb = $(val),
          canvas = thumb.find('canvas'),
          width = cssValueToNumber(canvas.css('width')),
          height = cssValueToNumber(canvas.css('height'));

          applyImageSmoothing(thumb, width, height, i);
        }
      })
    }

    function setImageAttributes(img, holder){
      var file = img.file,
      dimensions = getDimensions(img.width, img.height, initialScale),
      canvas = $('<canvas>');

      holder.attr({
        'data-last-modified': file.lastModified, 
        'data-last-modified-date': file.lastModifiedDate,
        'data-name': file.name,
        'data-size': file.size,
        'data-size-abbr': formatFileSize(file.size),
        'data-type': file.type,
        'data-type-abbr': file.type.split('/')[1].toUpperCase(),
        'data-max-height':img.height,
        'data-max-width':img.width
      });

      canvas.attr({
        'height':dimensions.height,
        'width':dimensions.width
      }).appendTo(holder);

      var context = $(canvas).get(0).getContext('2d');
      context.drawImage(img,0,0,dimensions.width,dimensions.height);

      $('#editOptions').attr('data-attachment', holder.attr('id'));
      editImage($('#iconContract').get(0).id);

      holder.removeClass('loading');

      if(lastThumbLoaded){
        $(document).trigger('allThumbsLoaded');
      }
    }

    function editImage(targetId, thumb){
      
      if(targetId != "blank"){
        thumb = $('#' + $('#editOptions').attr('data-attachment'));
      }

        var canvas = thumb.find('canvas'),
        canvasWidth = canvas.attr('width'),
        canvasHeight = canvas.attr('height'),
        canvasMinWidth, canvasMinHeight,
        canvasOffsetTop = canvas.get(0).offsetTop || 0, 
        canvasOffsetLeft = canvas.get(0).offsetLeft || 0, 
        topPos = 0, leftPos = 0; 

        if(canvas.css('width')){
           canvasWidth = cssValueToNumber(canvas.css('width'));
           canvasHeight = cssValueToNumber(canvas.css('height'));
           canvasMinWidth = cssValueToNumber(canvas.css('min-width'));
           canvasMinHeight = cssValueToNumber(canvas.css('min-height'));
           topPosCanvas = Math.round(cssValueToNumber(canvas.css('top')));
           leftPosCanvas = Math.round(cssValueToNumber(canvas.css('left')));
        }

        canvasAspectRatio = canvasWidth/canvasHeight;

      switch(targetId){

        case 'iconZoomIn':
          //Increase width by 10px
          canvasWidth = Math.round(canvasWidth + 10);
          canvasHeight = Math.round(canvasWidth/canvasAspectRatio);
          $('#iconZoomOut, #iconContract').removeClass('disableBtn');          
          break;

        case 'iconZoomOut':
          //Decrease width by 10px
          if((canvasWidth>canvasMinWidth) || (canvasHeight>canvasMinHeight)){
            canvasWidth = Math.round(canvasWidth - 10);
            canvasHeight = Math.round(canvasWidth/canvasAspectRatio);
          }
          break;

        case 'iconContract':
          //Resize canvas for best fit in holder
          var dimensions = getDimensions(canvas.attr('width'), canvas.attr('height'));
          canvasWidth = dimensions.width;
          canvasHeight = dimensions.height;
          canvasMinWidth = canvasWidth;
          canvasMinHeight = canvasHeight;
          canvas.css({
            'zIndex':10,
            'top':0,
            'left':0,
            'min-width':(canvasMinWidth + 'px'),
            'min-height':(canvasMinHeight + 'px')
          });
          break;

        case 'iconDelete':
          //Clear canvas
          var canvas = canvas.get(0),
          context = canvas.getContext('2d'),
          thumbs = $('.img_prev'),
          thumbIndex;
          context.clearRect(0, 0, canvas.width, canvas.height);
          totalBytesUploaded -= thumb.data('size');
          //Delete thumb
          thumbIndex = thumbs.index(thumb);
          thumb.remove();
          $('#editOptions').hide();
          //Reset draggable for all remaining thumbs as positions 
          //(and offset values have changed).
          $.each($('.img_prev'),function(i,val){
            if(i>=thumbIndex){
              setDraggable($(val).find('canvas'));
            }
          });

           updateStatus("load");

          return false;

          break;

        case 'blank':
          $.each($('.img_prev'),function(i,val){
            setDraggable($(val).find('canvas'));
          });
          return false;
          break;  
      }

      realignCanvas(thumb, canvasWidth, canvasHeight, canvasOffsetLeft, canvasOffsetTop, topPosCanvas, leftPosCanvas);

      setDraggable(canvas);

      enableEditOptions(thumb);

    }

    function realignAllThumbs(){
      $.each($('.img_prev'), function(i, val){
        editImage('blank', $(val));
      });
    }

    function realignCanvas(thumb, cW, cH, cOL, cOT, tPC, lPC){
      
      //Reposition canvas if misaligned with thumb
      //Shift image if outermost edge is within thumb
      var canvas = thumb.find('canvas'),
      thumbOffsetTop = thumb.get(0).offsetTop, 
      thumbOffsetLeft = thumb.get(0).offsetLeft,
      canvasMaxX = cOL + cW,
      canvasMaxY = cOT + cH,
      thumbMaxX = thumbOffsetLeft + thumbWidth,
      thumbMaxY = thumbOffsetTop + thumbHeight;

      if(thumbMaxX>canvasMaxX){
        lPC = Math.round(lPC + (thumbMaxX - canvasMaxX));
      }

      if(thumbMaxY>canvasMaxY){
        tPC = Math.round(tPC + (thumbMaxY - canvasMaxY));
      }

      canvas.css({
        'width':(cW + 'px'),
        'height':(cH + 'px'),
        'top':(tPC + 'px'),
        'left':(lPC + 'px')
      });

      //console.log('cW: ' + cW + ', cH: ' + cH + ', tPC: ' + tPC + ', lPC: ' + lPC);
    }

    function allThumbsLoaded(evt){ 
      updateStatus("load");
      
      $('.prompt.loading').hide();
      $('.prompt.loaded').show();
      $('#imagePreviews h2').text("Edit your thumbnails!");
      $('#download').show();
      $('#imagePreviews').removeClass('loading').addClass('loaded');
      realignAllThumbs();
    }

    function enableEditOptions(thumb){
      var canvas = $(thumb).find('canvas');
      canvasWidth = cssValueToNumber(canvas.css('width')),
      canvasHeight = cssValueToNumber(canvas.css('height')),
      canvasMinWidth = cssValueToNumber(canvas.css('min-width')),
      canvasMinHeight = cssValueToNumber(canvas.css('min-height'));

      // enable/disable edit option buttons
      if((canvasWidth>canvasMinWidth) || (canvasHeight>canvasMinHeight)){
        $('#iconZoomOut, #iconContract').removeClass('disableBtn');
      }else{
        $('#iconZoomOut, #iconContract').addClass('disableBtn');
      }
    }

    function positionEditOptionsPanel(thumb){

      // position edit panel 
      $('#editOptions').css({
        'width':(thumbWidth + 'px'),
        'position':'absolute',
        'z-index':1000,
        'top':(thumb.offsetTop + thumb.offsetHeight) + 'px',
        'left':thumb.offsetLeft + 'px'
      }).attr('data-attachment', thumb.id);

      enableEditOptions(thumb);
      
      //if over itself, do not hide!
      $('#editOptions').mouseover(function(event) {
        $(this).show();
      }).show(); 
    }

    function populateImageDetails(thumb){
      //canvas = $(thumb).find('canvas');
      $('#imageDetails .name').text($(thumb).data('name'));
      $('#imageDetails .fileType').text($(thumb).data('typeAbbr'));
      $('#imageDetails .sizeAbbr').text($(thumb).data('sizeAbbr'));
      $('#imageDetails .width').text($(thumb).data('maxWidth'));
      $('#imageDetails .height').text($(thumb).data('maxHeight'));
    }

    function updateTotalFileSize(fileSize){
      totalBytesUploaded += fileSize;
    }

    function lazyLoad(file, holder){
      //console.log(file);
      
      var imgHolder = $(holder),
      loader = imgHolder.find('.loader');
      freader = new FileReader();
      freader.file = file;
             
      freader.onload = function(event){
        var img = new Image();
        img.file = this.file;
        img.src = event.target.result;

        img.onload = function(event){
                 
          updateTotalFileSize(this.file.size);
          updateStatus("load");
          
          //Check if last thumb
          if(currentFileLoading === (fileList.length-1)){
            lastThumbLoaded = true;
          }else{
            //start loading next file
            currentFileLoading++;
            lazyLoad(fileList[currentFileLoading], $('.img_prev').eq(numImgPreviews + currentFileLoading));
          }

          loader.remove();
          setImageAttributes(this, imgHolder);
        }
      };

      freader.onprogress = function(pvt){
        //console.log(pvt);
        var ldr = imgHolder.find('.loader'),
          percent = Math.round(100 * pvt.loaded/pvt.total);
          
          updateLoader(ldr, percent);
      }

      freader.onerror = function(event) {
        reportError("load", file.name + ": Error reading file. Please try again.");
      };

      freader.readAsDataURL(freader.file);
      imgHolder.removeClass('waiting').addClass('loading');
    }

    function cleanseFileList(input){
      var file,
      numFiles = input.files.length;

      fileList = [];

      $.each(input.files, function(i, val){
        file = this;
        var count = $('.img_prev').length + i;
        //Make sure maxFileSize and maxNumFiles respected.
        if((count<maxNumFiles) && !(file.size>maxFileSize)){
          fileList.push(file);
        }else if(count>=maxNumFiles){
          alert("Only " + maxNumFiles + " images can be loaded per session.")
          return false;
        }else if(file.size>maxFileSize){
          reportError("load", file.name + " (" + formatFileSize(file.size) + ") exceeds maximum file size and was not loaded.");
        }
      
      });

      readImages(fileList);
      $('#images').val('');
    }
    
    function readImages(filelist) {
      $('#imageForm').hide();
      $('#download .prompt.predownload').show();
      $('#download .prompt.downloading').hide();
      $('#download .prompt.zipping').hide();

      $('.prompt.loading').show();
      $('.prompt.loaded').hide();
      $('#imagePreviews h2').text("Loading your thumbnails!");
      $('#imagePreviews').show().addClass('loading');
      $('.dropzone').removeClass('block').hide();
      $('.margin30').show();

      var file; 
      numImgPreviews = $('.img_prev').length;
      
      currentFileLoading=0;
              
      $.each(filelist,function(i,val){

        file = val; 
        
        var imgHolder = $('<div>'),
        imgId = 'img_prev_' + (numImgPreviews + i);

        imgHolder.attr({
          'id': imgId,
          'class': 'img_prev waiting'
        }).css({
          'width': thumbWidth,
          'height': thumbHeight
        });

        //create thumb loader
        var loader = $('<div>');
        loader.appendTo(imgHolder).addClass('loader');
        imgHolder.appendTo('section#imagePreviews');

        imgHolder.on('mouseover', function(event) {
          populateImageDetails(this);
          positionEditOptionsPanel(this)
        });        

      });

      var imgHolder = $('.img_prev').eq(numImgPreviews + currentFileLoading);
      lazyLoad(filelist[currentFileLoading], imgHolder);    
       
    }


    function reportError(type, msg){
      switch(type){

        case "load":
          $('#imagePreviews .errors').append('<li class="loadError">'+msg+'</li>');
          break;

        case "download":
          $('#download .errors').append('<li class="downloadError">'+msg+'</li>');
          break;

      }
      
    }

    function updateLoader(loader, percent){
      if(percent < 100){
        loader.css('width',(percent + '%'));
      }
    }

    function setOutputFileType(){
      outputFileType = $('input[name="file_type"]:checked').data('value');
      if(outputFileType === "image/jpeg"){
        outputFileExt = "jpg";
      }
    }

    function uploadImages(img, index){
      setOutputFileType();

      var totalDownloads;
  
      var imageObj = {};
      imageObj.src = img.src;
      imageObj.filename = img.name;
      imageObj.fileExt = outputFileExt;
      imageObj.index = index;

      var params = {
        expect:numUploads,
        session: sessionID,
        image: JSON.stringify(imageObj)
      };

      $.ajax({
        type: "POST",
        url: "uploadImage",
        data: params,
        dataType: 'json',
      }).done(function(data) {
        console.log(data);
        $('.img_prev').eq(parseInt(data.index)).addClass('downloaded');
        updateStatus("download");
          
      }).fail(function(jqXHR, textStatus, errorThrown){
        //console.log(jqXHR);
        reportError("download", textStatus);
        updateStatus("download");
      });
        
      //console.log(params);
    }

    function allImagesUploaded(evt){
      console.log(evt.type);
      $('#download .status').show().find('.process').text('Download complete for');
      $('#imagePreviews').removeClass('processing');
      downloadZipFile(sessionID);
    }

    function downloadZipFile(session){
      $('#download .status').show().find('.process').text('Preparing ZIP file containing');
      $('#download .prompt.zipping').show().find('a').on('click', function(evt){
        evt.preventDefault();
        $('#download .prompt.zipping').hide();
        $('#download .prompt.predownload').show();
        $('#btnDwnldThumbs').show();
      });

      var params = {
        session : session
      };

      $.ajax({
          type: "POST",
          url: "getZip",
          data: params,
          dataType: 'json',
        }).done(function(data) {
          console.log(data);
          var link = $('#linkToZip'),
          linkPath = window.location.href + data[0]; 
          link.attr('href', linkPath);
          $('#downloadFailMsg').show();
          window.location.href = linkPath;
          $('#imagePreviews').addClass('downloaded');
          $('#download h2').text('Download Complete!');
          $('#download .prompt').hide();
          $('#download .status').hide();

        });

    }

    function canvasToImage(canvas,type){
      var image = new Image(),
      index = $(canvas).data('index');

      image.onload = function(evt){
        //console.log(this.name + " loaded");
        uploadImages(this, index);
        $(canvas).trigger('cropComplete');
      };

      image.width = thumbWidth;
      image.height = thumbHeight;
      image.class = sessionID;
      image.name = $(canvas).data('name');

      if(customImageName.length>0){
        image.name = customImageName + "_" + (startIncrAt + index);
      }

      image.src = canvas.toDataURL(type);
    }

    function stripExt(name){
      return name.substr(0,name.lastIndexOf('.'));
    }

    function applyImageCrop(){
      //copy viewable area from image canvas onto cropCnvs.
      $('#imagePreviews').addClass('processing');

      $.each($('#imagePreviews canvas'), function(i,val){
        var canvas = $(this),
        thumb = canvas.parent(),
        cropArea = setCropArea(canvas),
        cropCnvs = $('<canvas>');
        cropCnvs.attr({
          'width':thumbWidth,
          'height':thumbHeight,
          'data-index':i,
          'data-name': stripExt(canvas.parent().data('name')) + "_" + thumbWidth + "x" + thumbHeight 
        }).appendTo('#imageProcesses')
        .on('cropComplete',function(evt){
          $(this).remove();
        });

        var origCnvs = canvas.get(0),
          origW = $(origCnvs).attr('width'),
          origH = $(origCnvs).attr('height'),
          imgAS = origW/origH,
          thumbAS = thumbWidth/thumbHeight,
          resizeW = cssValueToNumber($(origCnvs).css('width')),
          resizeH = cssValueToNumber($(origCnvs).css('height')),
          topPos = Math.abs(cssValueToNumber($(origCnvs).css('top'))) || 0;
          leftPos = Math.abs(cssValueToNumber($(origCnvs).css('left'))) || 0;
          dx = 0, 
          dy = 0, 
          dw = thumbWidth, 
          dh = thumbHeight,
          sw = cropArea.cropWidth,
          sh = cropArea.cropHeight,
          sx = Math.round(cropArea.cropWidth*(leftPos/thumbWidth)),
          sy = Math.round(cropArea.cropHeight*(topPos/thumbHeight));

        // console.log(
        //   "imgAS:" + imgAS + "," + "thumbAS:" + thumbAS + "," + "origW:" + origW + "," + "origH:" + origH + "," + "resizeW:" + resizeW + "," +
        //   "resizeH:" + resizeH + "," + "dx:" + dx + "," + "dy:" + dy + "," + "dw:" + dw + "," + "dh:" + dh + "," + "sx:" + sx + "," +
        //   "sy:" + sy + "," + "sw:" + sw + "," + "sh:" + sh );

        cropCxt = cropCnvs.get(0).getContext('2d');
        cropCxt.drawImage(origCnvs,sx,sy,sw,sh,dx,dy,dw,dh);
        canvasToImage(cropCnvs.get(0),outputFileType);

      });

    }

    function clearAllThumbs(){
      $('#imagePreviews, #imageProcesses').children('div').remove();
      $('#imagePreviews').removeClass('loading loaded smoothing smoothened downloaded');
      $('#download .status').hide();
      $('#btnDwnldThumbs').show();
      $('.errors li').remove();
    }

    function validateForm(event){
      
      if(event.type === 'click'){
        //clear input
        $('#images').val('');
        if($('.img_prev').length === maxNumFiles){
          alert("You have selected more than the maximum. Only " + maxNumFiles + " images can be loaded per session.")
          return false;
        }
      }else if(event.type === 'change'){

        input = event.target;
        files = input.files;
            
        thumbWidth = ($('#thumbWidth').val() != "") ? parseInt($('#thumbWidth').val()) : parseInt($('#thumbWidth').attr('placeholder'));
        thumbHeight = ($('#thumbHeight').val() != "") ? parseInt($('#thumbHeight').val()) : parseInt($('#thumbHeight').attr('placeholder'));

        customImageName = ($('#customImageName').val() != $('#customImageName').attr('placeholder')) ? $('#customImageName').val() : "";

        if($('#startIncrAt').val().length>0){
          startIncrAt = Math.round(parseInt($('#startIncrAt').val()));
        }
        
        if(($('#images').get(0).files.length > 0) && ($('.img_prev').length < maxNumFiles)){

          //Clear previews if already downloaded.
          if($('#imagePreviews').hasClass('downloaded')){
            var clearAllThumbsMsg = "Hold on! You will lose all your existing thumbs below by adding more files. Make sure you have downloaded all your thumbs first! Do you still want to continue adding new files?"

            if(confirm(clearAllThumbsMsg) == true){
              clearAllThumbs();
              cleanseFileList(input);
            }
          }else{
            $('#imagePreviews').removeClass('smoothened');
            $('#download .smoothing').show();
            cleanseFileList(input);
          }
          
        } 

      }
        
    }

    function downloadBtnClicked(evt){
      evt.preventDefault();
      $('#download h2').text('Preparing thumbs');
      $('#download .prompt.predownload').hide();
      $('#download .prompt.downloading').show();
      $('#download .status').show().find('.process').text('Downloading');
      $('#download .smoothing').hide();
        
      // for(var i=0; i<numUploads; i++){
      //   var ldr = $('<div>');
      //   ldr.appendTo($('#downloadComplete')).addClass('downloadLoader');
      // }
       
      $(this).removeClass('block').hide();
      updateStatus("download");

      if($('#imageProcesses canvas').length){
        $('#imageProcesses').children().remove();
      }

      var date = new Date();
      sessionID = date.getTime();
  
      setOutputFileType();
      applyImageCrop();
    }

    function updateStatus(process){

      var numProcessed;
      numUploads = $('.img_prev').length || 0;

      switch(process){

        case "load":
          
          $('.numthumbs').text(numUploads);
          $('.totbytes').text(formatFileSize(totalBytesUploaded));

          if(numUploads>0){
            $('.dropzone').hide();
          }else{
            //no thumbs therefore show dropzone
            $('.dropzone').show();
            $('.numthumbs').text('You have not added any images! ' + numUploads);
            $('#imagePreviews').removeClass('loaded').hide();
            $('#download').hide();
          }
     
          break;

        case "smooth":
          numProcessed = $('.img_prev.smooth').length;
          break;

        case "download":
          numProcessed = $('.img_prev.downloaded').length + $('.downloadError').length;
          console.log("numProcessed " +numProcessed+ ", numUploads " + numUploads);
          if(numProcessed === numUploads){
            $(document).trigger('allImagesUploaded');          
          }
          break;

      }

      $('#download .prepthumb').text(numProcessed);
      $('#download .numthumbs').text(numUploads);

      return numProcessed;

    }


    function formatFileSize(bytes){
      var fileSize;
      if(bytes>1e6){
        fileSize=parseFloat((bytes/1e6).toFixed(1)) + "MB";
      }else{
        fileSize=parseFloat((bytes/1e3).toFixed(1)) + "KB";
      }

      return fileSize;
    }

    $(document).ready(function(){
      
      $('#images').on('dragenter', function(evt){
        if(!$(this).hasClass('dragover')){
          $(this).addClass('dragover');
        }      
        //console.log(evt);
      }).on('dragover', function(evt){
        if(!$(this).hasClass('dragover')){
          $(this).addClass('dragover');
        }  
        //console.log(evt);
      }).on('drop dragleave', function(evt){
        if($(this).hasClass('dragover')){
          $(this).removeClass('dragover');
        }  
        //console.log(evt);
      }).change(validateForm);
      
      updateStatus("load");
      $('.maxNumFiles').text(maxNumFiles);
      $('.maxFileSize').text(formatFileSize(maxFileSize));
      

      $('#imagePreviews').mouseleave(function(evt) {
        evt.preventDefault();
        if(!$('#editOptions').hide()){
          $('#editOptions').hide();
        }
      });

      $('#btnImageSmoothing').click(smoothAllImages);
      
      $('#btnDwnldThumbs').click(downloadBtnClicked);

      //zoom in icon clicked
      $('#iconZoomIn, #iconZoomOut, #iconContract, #iconDelete').click(function(event){
        if(!($(this).hasClass('disableBtn'))){
          editImage(this.id);
        }
      });


    }).on('allThumbsLoaded', allThumbsLoaded)
      .on('allImagesSmoothed', allImagesSmoothed)
      .on('allImagesUploaded', allImagesUploaded);

$(window).resize(function(evt){
  realignAllThumbs();
}).on('dragenter', function(evt){
    
    if(!$('#images').hasClass('dragover')){
      $('#images').addClass('dragover');
    }  
    //console.log('window enter');
}).on('drop', function(evt){
    //console.log('window drop');
});