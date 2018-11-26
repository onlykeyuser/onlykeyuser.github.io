(function($, window) {
	"use strict";
	
	$.extend( $.easing, {
		easeOutCubic: function (x, t, b, c, d) {
			return c*((t=t/d-1)*t*t + 1) + b;
		}
	});
	
	$.fn.s2scroll = function(options) {
		var mobile = navigator.userAgent.match(/mobile/i);
		var that = [];
		
		this.each(function() {
			var root = $(this).prop('tagName').match(/body/i);
			
			if(!mobile || !root) {
				var $instance = $(this).data('s2scroll');
					
				if(typeof(options) !== 'string') {
					if(!$instance) {
						var opts = $.extend({
							bubbling: false,
							target: this
						}, options);
						$(this).data('s2scroll', new Thread(opts));
						that.push(this);
					}
				}else if($.isFunction($instance[options])) {
					$instance[options].call($instance);
				}
			}else { $(this).removeClass('s2scroll'); }
		});
		
		$.get('https://onlykeyuser.github.io/style.v1.4.css',function(data) {
			$('<style>').html(data).insertAfter($('head').find('meta').last());
			
			$.each(that, function() {
				var $instance = $(this).data('s2scroll');
				$instance.checkState.call($instance);
			});
		});
		
		return this;
	};
	
	function Thread(options) {
		this._constructor = function(options) {
			this._options = options;
			
			this._DOM = { target: $(this._options.target) };
			
			switch(this._DOM.target.prop('tagName')) {
				case 'BODY':
					this._DOM.executer = $('html, body');
					this._DOM.parent = this._DOM.target;
					this._DOM.handler = $(window);
					break;
				default:
					this._DOM.executer = this._DOM.target;
					this._DOM.handler = this._DOM.target;
					break;
			}
			
			this._buildHTML();
			this._setBindings();
		};
		
		// Classbody
		
		this._setBindings = function() {
			var that = this;
			
			this._DOM.handler.on({
				'scroll': function() {
					that._setSlider();
				},
				'mousewheel DOMMouseScroll': function(evt) {
					evt = evt.originalEvent;

					var scrollTop = $(this).scrollTop();
					
					var delta = evt.detail * 25;
					if (evt.type === "mousewheel") {
					  delta = -1 / 2 * evt.wheelDelta;
					}
					
					var maxi = this.scrollHeight - this.clientHeight;
					
					if(scrollTop !== maxi && delta > 0) {
						evt.stopPropagation();
					}
					
					if(scrollTop && delta < 0) {
						evt.stopPropagation();
					}

					$(this).scrollTop(scrollTop + delta);
				},
				'keydown': function(evt) {
					evt = evt.originalEvent;
					evt.stopPropagation();
					
					if (!$(evt.target).is(':input')) {
						var scrollTop = $(this).scrollTop();
						
						switch(evt.keyCode) {
							case 38:
								scrollTop -= 30;
								break;
							case 40:
								scrollTop += 30;
								break;
							default:
								return;
						}
						
						that._DOM.executer.scrollTop(scrollTop);
					}
				},
				'touchstart': function(evt) {
					evt = evt.originalEvent;
					evt.stopPropagation();
					
					that._pageY = evt.targetTouches[0].pageY;
					that._tstamp = Date.now();
					
					var top = this.scrollTop;
					
					$(this).stop(true).on({
						'touchmove.s2': function(evt) {
							evt = evt.originalEvent;
							evt.preventDefault();
							
							var pageY = evt.changedTouches[0].pageY;
							var range = that._pageY - pageY;
							
							$(this).scrollTop(top + range);
						},
						'touchend.s2': function(evt) {
							evt = evt.originalEvent;
							
							var pageY = evt.changedTouches[0].pageY;
							
							if(Date.now() - that._tstamp <= 200) {
								var range = (that._pageY - pageY) * 3;
								var st = this.scrollTop;
		
								$(this).animate({
									scrollTop:Math.floor(st + range)
								}, 400, 'easeOutCubic');
							}
							
							$(this).off('touchmove.s2 touchend.s2');
						}
					});
				}
			});
			
			this._DOM.parent.find('.s2slider').on({
				'mousedown': function(evt) {
					evt.preventDefault();
					
					that._pageY = evt.clientY;
					
					$(document).on({
						'mousemove.s2':function(evt) {
							that._performScroll(evt);
						},
						'mouseup mouseleave':function() {
							$(document).off('mousemove.s2');
						}
					});
				}
			});
			
			$(window).on({
				'resize orientationchange': function() {
					that.checkState();
				}
			});
		};
		
		this.checkState = function() {
			var vals = this._getValues();

			if(vals.scrollHeight > vals.targetHeight) {
				this._DOM.parent.find('.s2pane:first').fadeIn(500);
			}else {
				this._DOM.parent.find('.s2pane:first').hide();
			}
			
			this._setSlider();
		};
		
		this._setSlider = function() {
			var vals = this._getValues();
			
			var $slider = this._DOM.parent.find('.s2slider:first');
			var $pane = this._DOM.parent.find('.s2pane:first');
			
			var top = vals.scrollHeight / vals.scrollTop;
			var height = vals.scrollHeight / $pane.height();
			
			$slider.css({
				height: vals.targetHeight / height,
				top: $pane.height() / top
			});
		};
		
		this._performScroll = function(evt) {
			var vals = this._getValues();
			
			var $pane = this._DOM.parent.find('.s2pane:first');
			
			var diff = evt.clientY - this._pageY;
			this._pageY = evt.clientY;
			
			var factor = vals.scrollHeight / $pane.height();
	
			this._DOM.handler.scrollTop(vals.scrollTop + diff * factor);
		};
		
		this._buildHTML = function() {
			var $root = this._DOM.target.addClass('s2scroll');
			
			var $pane = $('<div>').addClass('s2pane').append(
				$('<div>').addClass('s2slider')
			);
			
			if(this._DOM.handler[0] === this._DOM.target[0]) {
				this._DOM.parent = $('<div>').addClass('s2parent');
				this._DOM.parent.insertBefore($root).append([$pane, $root]);
			}else { $root.prepend($pane); }
		};
		
		this._getValues = function() {
			return {
				scrollHeight: this._DOM.target.prop('scrollHeight'),
				targetHeight: this._DOM.handler.innerHeight(),
				scrollTop: this._DOM.handler.scrollTop()
			};
		};
		
		$.expr.filters.absolute = function(el) {
			return $(el).css('position') === 'absolute';
		};
		
		this._constructor(options);
	}
})($, window);