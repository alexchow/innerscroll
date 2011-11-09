Innerscroll v0.1
=================
Thursday, October 21st 2011

Inspiration from Facebook, iOS and Jonathan Azoff

Innerscroll provides an automatically fading in/out scrollbar while maintaining 100% native scrolling behaviour including (but not limited to) native performance, native inertial motion (especially on Macs), native scrolling with keyboard arrow keys, etc. To achieve an absolutely native feel, I allow the browser to do the scrolling (unlike all other implementations I have found which override the the browser with overflow:hidden and move the content manually, thus losing the native feel) and create an artificial scrollbar which imitates the real one.


<http://www.alexcchow.com/innerscroll>

License
-------
Copyright 2011, Alexander Chow

Licensed under the MIT license

<https://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt>

Usage
-----
(Requires jQuery and jQuery UI Draggable)

Basic:

<pre>$(content).innerscroll({
    destination: $(wrapper),
});</pre>

where `content` is the DOM element that is overflowing and `wrapper` is content's immediate parent with almost identical dimensions (but only a slightly smaller width to hide the browser's native scrollbars).

With options:

<pre>$(selector).innerscroll(options);</pre>

+ `selector`
    Selects for the overflowing element to which you want to apply innerscroll
+ `options`
    Required JavaScript object (but only one of its properties is required)
    * `options.destination` `{jQuery: undefined}`
        - Required. The DOM element (or jQuery-selected DOM element) that is the immediate parent of `selector` (the target) that is meant to simply wrap `selector` and thus has almost identical dimensions (only slightly smaller width to hide the browser's native scrollbars)
    * `options.draggable` `{Boolean: true}`
        - Optional. Set to false to disable dragging of the innerscroll's scrollbar thumb
    * `options.autoFadeout` `{Boolean: true}`
        - Optional. Set to false to disable the automatic hiding (fading out) of the innerscroll's scrollbar thumb.
    * `options.leftAdjust` `{Integer: 0}`
        - Optional. Use this to manually adjust the left position (in pixels) of the scrollbar. Positive is rightward.
    * `options.fadeoutDelay` `{Integer: 200}`
        - Optional. Use this to manually adjust the delay (in milliseconds) before initiating automatic fadeout of the scroll thumbs.
    
        
Notes
-----
jQuery is required and the jQuery UI Draggable interaction is required for dragging functionality (dragging of the thumb will not work without it). 

When you have an overflowing DOM element to which you would like to apply innerscroll, simply wrap it inside a wrapper element. Then, try applying innerscroll to the target with the wrapper as the `destination`. Adjust the dimensions on the wrapper accordingly to hide the native scrollbars.