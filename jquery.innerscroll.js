//Copyright 2011, Alexander Chow
//Licensed under the MIT license
// https://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt

(function($, w, m, i) {
    
    i = $.fn.innerscroll = function(options) {
        // valid options:
        // destination: REQUIRED. Must be passed a DOM element (or a jQuery selection of a DOM element). 
        //          The scrollbar thumbs will be placed in the destination. Highly recommended to be the parent of the target
        // overflow-x: Default is null/undefined (value will be taken from the DOM element). Possible values: visible, hidden, scroll, auto.
        // overflow-y: Default is null/undefined (value will be taken from the DOM element). Possible values: visible, hidden, scroll, auto.
        
        return this.each(function () {
            i.init($(this), options);
        });
    };
    
    // Call the remover (i.e. deconstructor) for innerscroll.
    $.fn.removeInnerscroll = function(options) {
        return this.each(function () {
            var remover = $(this).data(i.removerKey);
            if ($.isFunction(remover)) {
                remover();
            }
        });
    };
    
    $.extend(i, {
        
        getNativeScrollbarWidth: function() {
            var inner = document.createElement('p');
            inner.style.width = "100%";
            inner.style.height = "200px";

            var outer = document.createElement('div');
            outer.style.position = "absolute";
            outer.style.top = "0px";
            outer.style.left = "0px";
            outer.style.visibility = "hidden";
            outer.style.width = "200px";
            outer.style.height = "150px";
            outer.style.overflow = "hidden";
            outer.appendChild (inner);
            
            document.body.appendChild (outer);
            var w1 = inner.offsetWidth;
            outer.style.overflow = 'scroll';
            var w2 = inner.offsetWidth;
            if (w1 == w2) w2 = outer.clientWidth;

            document.body.removeChild (outer);

            return (w1 - w2);
        },
        
        removerKey: "iscrollRemover",           // the key name used to get to the remover.
                                                // see init() function
        
        // the event names to listen to to perform the give action
        events: {
            moveThumbs : "scroll",
            mouseenter : "mouseenter",
            mousemove: "mousemove",
            mouseleave: "mouseleave"
        },
        
        constants: {
            thumbThickness: 6,
            thumbOpacity: 0.7,
            fadeSlow: 1000,
            fadeMedium: 400,
            fadeFast: 200,
            trackFocusPadding: 20           // distance (in pixels) away from the tracks to which the thumbs should be displayed
        },
        
        init: function(target, options) {            
            
            // data to be passed to event handler functions
            var data = {
                target: target,
                destination: $(options.destination),
                options: options,
                // save the original CSS settings that will be changed so the deconstructor can revert them
                originalCSS: {
                    'overflow-x': target.css('overflow-x'),
                    'overflow-y': target.css('overflow-y'),
                    'cursor': target.css('cursor')
                },
                sizing: i.getSizing(target, $(options.destination)),
                opacityLocked: false
            };
            
            // must set destination position to relative if it is static
            // if (data.destination.css('position') === 'static') {
            //     console.log(data.destination.css('position'));
            //     data.destination.css('position','relative');
            // }
            
            // setup the remover (deconstructor) function and make it accessible via data(i.removerKey)
            target.removeInnerscroll();         // remove the old bindings
            target.data(i.removerKey, i.removerFactory(target, data));
            
            target.css({
                'overflow-y': 'auto',
                'overflow-x': 'hidden'
            }).bind(i.events.moveThumbs, data, i.moveThumbs).bind(i.events.mouseenter, data, i.mouseenter);
            data.destination.bind(i.events.mousemove, data, i.mousemove).bind(i.events.mouseleave, data, i.mouseleave);
            
            
            data.thumbs = {};       // put the thumbs objects here
            data.tracks = {};       // put the tracks objects here
            
            data.tracks.vertical = $('<div/>').css(i.getTrackCSS(data.sizing.tracks.vertical));
            data.thumbs.vertical = $('<div/>').css(i.getThumbCSS(data.sizing.thumbs.vertical))
                .css({
                    '-moz-user-select': '-moz-none',
                    '-khtml-user-select': 'none',
                    '-webkit-user-select': 'none',
                    '-user-select': 'none',
                    'cursor': 'pointer'
                }).fadeTo(0, i.constants.thumbOpacity);
            
            data.tracks.vertical.prepend(data.thumbs.vertical);
            data.destination.prepend(data.tracks.vertical);
            data.thumbs.vertical.fadeTo(i.constants.fadeSlow, 0);
            
            if(options.draggable && $.isFunction($.fn.draggable)) {
                data.thumbs.vertical.draggable({
                    containment: data.tracks.vertical,
                    cursor: 'pointer',
                    scroll: false,
                    start: function() {
                        // drag started. Deregister all other listeners
                        target.unbind(i.events.moveThumbs, i.moveThumbs).unbind(i.events.mouseenter, i.mouseenter);         
                        data.destination.unbind(i.events.mousemove, i.mousemove).unbind(i.events.mouseleave, i.mouseleave);
                        // lock the opacity
                        data.opacityLocked = true;
                        data.thumbs.vertical.stop(true, true).fadeTo(i.constants.fadeFast, i.constants.thumbOpacity);

                    },
                    drag: function(event, ui) {
                        data.target.scrollTop(data.thumbs.vertical.position().top * data.sizing.getTargetScrollHeight() / data.sizing.getTargetHeight());
                    },
                    stop: function() {
                        // release opacity lock
                        i.hideThumbs(data);         
                        data.opacityLocked = false;             
                        // reregister other listeners
                        data.destination.bind(i.events.mousemove, data, i.mousemove).bind(i.events.mouseleave, data, i.mouseleave);
                        target.bind(i.events.moveThumbs, data, i.moveThumbs).bind(i.events.mouseenter, data, i.mouseenter);         
                    }
                });
            }
        },
        
        // a factory which will create deconstructor functions
        removerFactory: function(target, data) {
            return function() {
                target.css(data.originalCSS).unbind(i.events.moveThumbs, i.moveThumbs)
                .unbind(i.events.flashThumbs, i.flashThumbs)
                .unbind(i.events.mousemove, i.mousemove);
                if (data.thumbs) {
                    if (data.thumbs.horizontal) {
                        data.thumbs.horizontal.remove();
                    }
                    if (data.thumbs.vertical) {
                        data.thumbs.vertical.remove();
                    }
                }
            };
        },
        
        flashThumbs: function(event) {
            if (!event.data.opacityLocked) {
                if (event.data.hideThumbsTimeout) {
                    clearTimeout(event.data.hideThumbsTimeout);
                }
                // show the thumbs
                if (event.data.thumbs.vertical) {
                    event.data.thumbs.vertical.stop(true, true).fadeTo(i.constants.fadeFast, i.constants.thumbOpacity);
                }
                if (event.data.thumbs.horizontal) {
                    event.data.thumbs.horizontal.stop(true, true).fadeTo(i.constants.fadeFast, i.constants.thumbOpacity);
                }


                i.hideThumbs(event.data);
            }
        },
        
        moveThumbs: function(event) {
            var thumbs = event.data.thumbs;
            var sizing = event.data.sizing;
            
            // calculate new height and top position of thumbs
            var newHeight = sizing.calcVerticalThumbHeight();
            var newTop = sizing.calcVerticalThumbTop();
            if (newHeight != thumbs.vertical.height()) {
                thumbs.vertical.css('height', newHeight+'px');
            }
            if (newTop != thumbs.vertical.position().top) {
                thumbs.vertical.css('top', newTop+'px')
            }
            
            i.flashThumbs(event);
        },
        
        mousemove: function(event) {
            var verticalTrackLeft = event.data.thumbs.vertical.offset().left;
            var mouseX = event.pageX;
            // check if mouse position is near the vertical track
            if (m.abs(mouseX-verticalTrackLeft) <= i.constants.trackFocusPadding) {
                event.data.opacityLocked = true;
                event.data.thumbs.vertical.stop(true, true).fadeTo(i.constants.fadeFast, i.constants.thumbOpacity);
            } else {
                // not near the vertical tracks
                if (event.data.opacityLocked) {
                    // event.data.thumbs.vertical.stop(true, true).fadeTo(i.constants.fadeFast, 0);
                    i.hideThumbs(event.data);
                    event.data.opacityLocked = false;
                }
            }

        },
        
        mouseenter: function(event) {
            i.flashThumbs(event);
        },
        
        mouseleave: function(event) {
            // console.log('mouseleave event fired');
            event.data.opacityLocked = false;
            i.hideThumbs(event.data);
        },
        
        hideThumbs: function(data) {
            if (data.hideThumbsTimeout) {
                clearTimeout(data.hideThumbsTimeout);
            }
            data.hideThumbsTimeout = setTimeout(function() {
                data.hideThumbsTimeout = undefined;
                if (!data.opacityLocked) {
                    data.thumbs.vertical.stop(true, true).fadeTo(i.constants.fadeFast, 0);
                }
            }, 200);
        },
        
        getSizing: function(target, dest) {
            var scrollBarWidth = i.getNativeScrollbarWidth();
            
            var sizing = {
                getTargetWidth: function() {
                    return target.width();
                },
                getTargetHeight: function() {
                    return target.height();
                },
                getTargetScrollHeight: function() {
                    return parseFloat(target.get(0).scrollHeight, 10);
                },
                getTargetScrollWidth: function() {
                    return parseFloat(target.get(0).scrollWidth, 10);
                },
                thumbs: {
                    horizontal: {},
                    vertical: {
                        top: 0,
                        width: i.constants.thumbThickness,
                        corner: i.constants.thumbThickness / 2,
                        left: 0
                    }
                },
                tracks: {
                    horizontal: {},
                    vertical: {
                        left: target.position().left + target.width() - scrollBarWidth - i.constants.thumbThickness,
                        top: target.position().top,
                        height: target.height()
                    }
                }
            };
            
            // calculate the height of the thumbs
            sizing.calcVerticalThumbHeight = function() {
                var value = 0;
                if (sizing.getTargetScrollHeight() <= sizing.getTargetHeight()) {
                    // don't need vertical thumbs since everything is visible
                    value = 0;
                } else {
                    value = sizing.getTargetHeight() * sizing.getTargetHeight() / sizing.getTargetScrollHeight();
                }
                return value;
            };
            sizing.thumbs.vertical.height = sizing.calcVerticalThumbHeight();
            
            // function that returns what should be the top position of the thumb
            sizing.calcVerticalThumbTop = function() {
                return ( target.height() * parseFloat(target.get(0).scrollTop,10) / sizing.getTargetScrollHeight() );
            };
            
            return sizing;
                        
        },
        
        getThumbCSS: function(size) {
            return {
                position: "absolute",
                "background-color": "black",
                width: size.width + "px",
                height: size.height + "px",
                left: size.left ? (size.left +"px") : (0 + "px") ,
                top: size.top ? (size.top + "px") : (0 + "px"),
                "-moz-border-radius": size.corner + "px",
                "-webkit-border-radius": size.corner + "px",
                "border-radius": size.corner + "px",
                "z-index": "999"
            }

        },
        
        getTrackCSS: function(size) {
            return {
                position:'absolute',
                height: size.height + "px",
                left:size.left+"px",
                top: size.top+"px"         
            }
        }
        
    })
    
})(jQuery, window, Math)