document.addEventListener("DOMContentLoaded", function (event) {
  var viewer = OpenSeadragon({
    id: "container",
    xmlns: "http://schemas.microsoft.com/deepzoom/2008",
    prefixUrl: "//openseadragon.github.io/openseadragon/images/",
    showNControls: false,
    zoomInButton: "zoom-in",
    zoomOutButton: "zoom-out",
    homeButton: "home",
    immediateRender: true,
    // zoomPerClick: 1.0,
    // minZoomImageRatio: 1.0,
    // maxZoomPixelRatio: 1.0,
  });

  // Create a point exactly in the middle of the viewport
  var $viewer = $("#container");

  var middle = new OpenSeadragon.Point(
    $viewer.width() / 2,
    $viewer.height() / 2
  );

  function updateMiddle(offset) {
    middle.x = offset;
  }

  // Keep track of the two images we're splitting
  var leftImage = null;
  var rightImage = null;

  var leftRect = new OpenSeadragon.Rect(0, 0, 0, 0);
  var rightRect = new OpenSeadragon.Rect(0, 0, 0, 0);

  viewer.addTiledImage({
    tileSource: "./dz/orig.dzi",
    success: function (event) {
      leftImage = event.item;
      imagesLoaded();
    },
  });

  viewer.addTiledImage({
    tileSource: "./dz/xray.dzi",
    success: function (event) {
      rightImage = event.item;
      imagesLoaded();
    },
  });

  // Handle pan and zoom events
  viewer.addHandler("animation", imagesClipAggressive);
  viewer.addHandler("animation-start", imagesClip);

  // Basic function to check when both images are loaded
  function imagesLoaded() {
    if (leftImage && rightImage) {
      leftRect.height = leftImage.getContentSize().y;
      rightRect.height = rightImage.getContentSize().y;

      imagesClip();

      initClip();
    }
  }

  var oldSpringX = 0.5;

  function imagesClipAggressive() {
    var newSpringX = viewer.viewport.centerSpringX.current.value;
    var deltaSpringX = newSpringX - oldSpringX;
    oldSpringX = newSpringX;

    var fixedMiddle =
      viewer.viewport.viewerElementToViewportCoordinates(middle);
    fixedMiddle.x += deltaSpringX;

    var rox = rightImage.viewportToImageCoordinates(fixedMiddle).x;
    var lox = leftImage.viewportToImageCoordinates(fixedMiddle).x;

    imagesClipShared(rox, lox);
  }

  function imagesClip() {
    var rox = rightImage.viewerElementToImageCoordinates(middle).x;
    var lox = leftImage.viewerElementToImageCoordinates(middle).x;

    imagesClipShared(rox, lox);
  }

  function imagesClipShared(rox, lox) {
    rightRect.x = rox;
    rightRect.width = rightImage.getContentSize().x - rox;

    leftRect.width = lox;

    leftImage.setClip(leftRect);
    rightImage.setClip(rightRect);
  }

  function initClip() {
    //console.log( leftImage, rightImage );
    //console.log( rightImage.getContentSize() );

    // TODO: Abstract this away
    var $handle = $(".slider-handle");
    var $container = $handle.parents(".slider-container");

    // We will assume that the width of the handle element does not change
    var dragWidth = $handle.outerWidth();

    // However, we will track when the container resizes
    var containerWidth, containerOffest, minLeft, maxLeft;

    function updateContainerDimensions() {
      containerWidth = $container.outerWidth();
      containerOffset = $container.offset().left;
      minLeft = containerOffset + 10;
      maxLeft = containerOffset + containerWidth - dragWidth - 10;

      // Spoof the mouse events
      var offset = $handle.offset().left + dragWidth / 2;
      var event;

      // Bind the drag event
      event = new jQuery.Event("mousedown");

      event.pageX = offset;

      $handle.trigger(event);

      // Execute the drag event
      event = new jQuery.Event("mousemove");
      event.pageX = offset;

      $container.trigger(event);

      // Unbind the drag event
      $handle.trigger("mouseup");
    }

    // Retrieve initial container dimention
    updateContainerDimensions();

    // Bind the container resize
    $(window).resize(updateContainerDimensions);

    // We are just going to assume jQuery is loaded by now
    // Eventually, I'll make this work without jQuery
    $handle.on("mousedown vmousedown", function (e) {
      var xPosition = $handle.offset().left + dragWidth - e.pageX;

      function trackDrag(e) {
        var leftValue = e.pageX + xPosition - dragWidth;

        //constrain the draggable element to move inside its container
        leftValue = Math.max(leftValue, minLeft);
        leftValue = Math.min(leftValue, maxLeft);

        var widthPixel = leftValue + dragWidth / 2 - containerOffset;
        var widthFraction = widthPixel / containerWidth;
        var widthPercent = widthFraction * 100 + "%";

        $handle.css("left", widthPercent);

        updateMiddle(widthPixel);
        imagesClip();
      }

      $container.on("mousemove vmousemove", trackDrag);

      $handle.add($container).one("mouseup vmouseup", function (e) {
        $container.unbind("mousemove vmousemove", trackDrag);
      });

      e.preventDefault();
    });
  }

  viewer.addOverlay({
    id: "1",
    location: new OpenSeadragon.Point(0.9, 0.1),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "2",
    location: new OpenSeadragon.Point(0.5, 0.13),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "3",
    location: new OpenSeadragon.Point(0.7, 0.03),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "4",
    location: new OpenSeadragon.Point(0.35, 0.2),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "5",
    location: new OpenSeadragon.Point(0.6, 0.4),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "6",
    location: new OpenSeadragon.Point(0.2, 0.03),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "7",
    location: new OpenSeadragon.Point(0.27, 0.35),
    checkResize: false,
  });

  viewer.addOverlay({
    id: "8",
    location: new OpenSeadragon.Point(0.9, 0.4),
    checkResize: false,
  });

  let currentIndex = 0;

  viewer.addHandler("canvas-key", (ev) => {
    const keyCode = ev.originalEvent.keyCode;
    const overlays = viewer.currentOverlays;
    if (keyCode === 37) {
      currentIndex =
        currentIndex === 0 ? overlays.length - 1 : currentIndex - 1;
      goToOverlay();
    }
    if (keyCode === 39) {
      currentIndex =
        currentIndex === overlays.length - 1 ? 0 : currentIndex + 1;
      goToOverlay();
    }
  });

  function goToOverlay() {
    // console.log(viewer.currentOverlays[currentIndex]);
    viewer.viewport.fitBoundsWithConstraints(
      viewer.currentOverlays[currentIndex].bounds
    );
  }

  const points = document.querySelectorAll(".openseadragon-overlay");
  points.forEach((point) => {
    const content = point.getAttribute("id");
    point.innerHTML = `
    <svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
      <use href="images/sprite.svg#${content}"/>
    </svg>
    `;
  });

  const swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 80,
    autoHeight: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true,
    },
    breakpoints: {
      1024: {
        autoHeight: false,
      },
    },
  });

  const swiperVideoBlock = new Swiper(".video__slider", {
    slidesPerView: 1,
    spaceBetween: 80,
    autoHeight: true,
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    pagination: {
      el: ".swiper-pagination",
      type: "bullets",
      clickable: true,
    },
    breakpoints: {
      1024: {
        autoHeight: false,
      },
    },
  });

  const video = document.querySelector(".promo__video");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      document.querySelector(".promo__title").classList.add("animated");
      video.classList.add("frame");
      setTimeout(() => {
        video.play();
      }, 300);
    } else {
      document.querySelector(".promo__title").classList.remove("animated");
      video.pause();
    }
  });

  Fancybox.bind("[data-fancybox]", {
    Image: {
      zoom: false,
    },
    video: {
      autoplay: false,
      ratio: 16 / 9,
      Thumbs: false,
    },
  });

  Fancybox.defaults.Hash = true;
});

// Fancybox.getInstance().plugins.Thumbs.state;
// Fancybox.getInstance().plugins.Thumbs.toggle();

// var videos = document.querySelectorAll(".promo__video"),
//   fraction = 0.8;
// function checkScroll() {
//   for (var i = 0; i < videos.length; i++) {
//     var video = videos[i];

//     var x = video.offsetLeft,
//       y = video.offsetTop,
//       w = video.offsetWidth,
//       h = video.offsetHeight,
//       r = x + w, //right
//       b = y + h, //bottom
//       visibleX,
//       visibleY,
//       visible;

//     visibleX = Math.max(
//       0,
//       Math.min(
//         w,
//         window.pageXOffset + window.innerWidth - x,
//         r - window.pageXOffset
//       )
//     );
//     visibleY = Math.max(
//       0,
//       Math.min(
//         h,
//         window.pageYOffset + window.innerHeight - y,
//         b - window.pageYOffset
//       )
//     );

//     visible = (visibleX * visibleY) / (w * h);

//     if (visible > fraction) {
//       video.play();
//     } else {
//       video.pause();
//     }
//   }
// }

// window.addEventListener("scroll", checkScroll, false);
// window.addEventListener("resize", checkScroll, false);

// viewer.addHandler("canvas-drag", (event) => {
//   event.preventDefaultAction = true;
// });
