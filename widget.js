// Neohud v1.3 by Neoshin

// Variables
let setting = {
    'displayTime': 5, 				// Seconds
  	'transitionTime': 600,			// Milliseconds
  	'alertAnimation': 'slideUp'
};
let twitch = {
  	'follower': {
    	'icon': 'heart',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1
    },
  	'subscriber': {
    	'icon': 'star',
      	'giftIcon': 'gift',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0,
      	'tier': '',
      	'sender': '',
      	'gifted': false,
      	'bulkGifted': false,
      	'tts': {
        	'enabled': false,
          	'volume': 0.75,
          	'voice': 'Hans',
          	'delay': 0
        }
    },
  	'tip': {
    	'icon': 'dollar-sign',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0,
      	'tts': {
        	'enabled': false,
          	'volume': 0.75,
          	'voice': 'Hans',
          	'delay': 0
        }
    },
  	'cheer': {
    	'icon': 'gem',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0,
      	'tts': {
        	'enabled': false,
          	'volume': 0.75,
          	'voice': 'Hans',
          	'delay': 0
        }
    },
  	'host': {
    	'icon': 'users',
      	'name': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0
    },
  	'raid': {
    	'icon': 'users',
      	'name': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0
    },
};
let social = {
	'twitch': {
    	'icon': 'twitch',
      	'text': ''
    },
  	'youtube': {
    	'icon': 'youtube',
      	'text': ''
    },
  	'tiktok': {
    	'icon': 'tiktok',
      	'text': ''
    },
  	'instagram': {
    	'icon': 'instagram',
      	'text': ''
    },
  	'twitter': {
    	'icon': 'twitter',
      	'text': ''
    },
  	'facebook': {
    	'icon': 'facebook',
      	'text': ''
    }
};
let custom = {
	'custom1': {
    	'text': ''
    },
  	'custom2': {
    	'text': ''
    },
  	'custom3': {
    	'text': ''
    }
};
let channelName 		= '';
let currency 			= {};
let sessionData 		= {};
let fieldData 			= {};
let feed 				= {};
let feedPos				= 0;
let eventQueue			= [];
const feedContainer		= $('.feed-container');
const feedText			= feedContainer.children('.text');
const alertContainer	= $('.alert-container');
const alertText			= alertContainer.children('.text');

// On Widget Load
window.addEventListener('onWidgetLoad', function(obj) {	
  	// Update Variables
  	channelName = obj.detail.channel.username;
  	currency 	= obj.detail.currency;
  	sessionData = obj.detail.session.data;
  	fieldData 	= obj.detail.fieldData;
  	
  	// Update Objects
  	updateStyles();
  	updateSetting();
  	updateTwitch();
  	updateSocial();
  	updateCustom();
  	updateFeed();
  	
  	// Run the rotating feed
  	runFeed();
});

// On Session Update
window.addEventListener('onSessionUpdate', function(obj) {  
  	// Update Variables
	sessionData = obj.detail.session;
  
  	// Update Objects
  	updateTwitch();
  	updateFeed();
  
  	// Runs an alert if triggered
  	if (eventQueue.length > 0 && eventQueue.length < 2) {
    	runAlert();
    }
});

// On Event Received
window.addEventListener('onEventReceived', function (obj) {
  	// Variables
  	const eventListener = obj.detail.listener;
  	const eventData 	= obj.detail.event;
  
  	if (eventListener.includes('latest')) {
      	const eventObj = {
        	'type': eventListener.replace('-latest', ''),
          	'name': eventData.name,
          	'amount': eventData.amount,
          	'tier': eventData.tier,
          	'sender': eventData.sender,
          	'gifted': eventData.gifted,
          	'bulkGifted': eventData.bulkGifted,
          	'message': eventData.message
        };
      
    	eventQueue.push(eventObj);
    }
});

/* ====================| Update Function |==================== */
// Updates the main container with custom style classes
function updateStyles() {
  	if (fieldData.backgroundStyle === 'false') return;
  
  	const backgroundStyleClass = `bgstyle-${fieldData.backgroundStyle}`; 
  	
  	$('.main-container').addClass(backgroundStyleClass);
}

// Updates the settings object with the current available data
function updateSetting() {
  	setting.displayTime 	= fieldData.displayTime;
  	setting.transitionTime	= fieldData.transitionTime;
  	setting.alertAnimation	= fieldData.alertAnimation;
}

// Updates the twitch object with the current available data
function updateTwitch() {  
  	for (const [key, obj] of Object.entries(twitch)) {
    	twitch[key].icon 	= fieldData[key + 'Icon'];												// Icon
        twitch[key].sound 	= fieldData[key + 'Sound'];												// Sound
        twitch[key].volume 	= fieldData[key + 'Volume'] / 100;										// Volume
        twitch[key].name 	= sessionData[key + '-latest'].name === '' 								// Name
          ? twitch[key].placeholder 
        : sessionData[key + '-latest'].name;

        if (twitch[key].hasOwnProperty('giftIcon')) {												// Gift Icon
          	twitch[key].giftIcon = fieldData[key + 'GiftIcon'];
        }

        if (twitch[key].hasOwnProperty('placeholder')) {											// Placeholder
          	twitch[key].placeholder = fieldData[key + 'Placeholder'];
        }

        if (twitch[key].hasOwnProperty('amount')) {													// Amount
          	twitch[key].amount = sessionData[key + '-latest'].amount;
        }

        if (twitch[key].hasOwnProperty('tier')) {													// Subtier
        	twitch[key].tier = sessionData[key + '-latest'].tier;
        }

        if (twitch[key].hasOwnProperty('tts')) {													// TTS
            twitch[key].tts.enabled 	= fieldData[key + 'TTSEnabled'];
            twitch[key].tts.volume 	= fieldData[key + 'TTSVolume'] / 100;
            twitch[key].tts.voice 	= fieldData[key + 'TTSVoice'];
            twitch[key].tts.delay 	= fieldData[key + 'TTSDelay'];
        }
    };
}

// Update the social labels
function updateSocial() {  
	for (const [key, obj] of Object.entries(social)) {
      	social[key].text 		= fieldData.hasOwnProperty(key) && fieldData[key] !== '' ? fieldData[key] : '';
        social[key].isSocial	= true;
    }
}

// Update the custom labels
function updateCustom() {  
	for (const [key, obj] of Object.entries(custom)) {
      	custom[key].text = fieldData.hasOwnProperty(key) && fieldData[key] !== '' ? fieldData[key] : '';
    }
}

// Updates the feed with the enabled labels
function updateFeed() {
  	// Inserts twitch labels into the feed
  	for (const [key, obj] of Object.entries(twitch)) {
    	if (fieldData.hasOwnProperty(key + 'Latest') && fieldData[key + 'Latest'] === 'true') {
      		feed[key] = twitch[key];
        }
    }
  
  	// Inserts social labels into the feed
  	for (const [key, obj] of Object.entries(social)) {
    	if (social[key].text !== '') {
      		feed[key] = social[key];
        }
    }
  
  	// Inserts custom labels into the feed
  	for (const [key, obj] of Object.entries(custom)) {
    	if (custom[key].text !== '') {
      		feed[key] = custom[key];
        }
    }
}

/* ====================| Feed Functions |==================== */
// Displays all the enabled labels in a feed
function runFeed() {
  	const feedKeys = Object.keys(feed);
  	
  	if(feedKeys.length < 1) return;
  
    let feedType = feedKeys[feedPos];
  
    if (feedKeys.length < 2) {
      	feedText.html(getLabel(feedType));
	} else {
      	setInterval(function() {
          	if (eventQueue.length > 0) {
              	feedText.html(getLabel(eventQueue[0].type, true)); 
            } else {
            	feedType = feedKeys[feedPos];
			
                feedContainer.fadeOut(setting.transitionTime, function() {
                    feedText.html(getLabel(feedType));
                    feedContainer.fadeIn();
                });

                feedPos++;
            }
          
          	if (feedPos == feedKeys.length) {
              	feedPos = 0;
            }
      	}, setting.displayTime * 1000);
    }
}

/* ====================| Event Functions |==================== */
// Updates the event queue and fires another alert if there are still events in the queue
function updateEventQueue() {
	eventQueue.shift();
  	
    if (eventQueue.length > 0) {
    	runAlert();
    }
}

// Runs an alert if the triggered event is enabled
function runAlert() {  	
    // Updates the alert text element
    alertText.html(getLabel(eventQueue[0].type, true));
  	
  	// Plays the alert sound
  	playAlertSound(eventQueue[0].type);
  
  	// Plays the alert TTS
  	playAlertTTS(eventQueue[0].type, eventQueue[0].message);

    // Fires the selected alert animation
    switch(setting.alertAnimation) {
        case 'fade':
        	alertAnimationFade();
        	break;
    	case 'slideUp':
        	alertAnimationSlideUp();
        	break;
        case 'slideDown':
        	alertAnimationSlideDown();
        	break;
        case 'slideRight':
        	alertAnimationSlideRight();
        	break;
        case 'slideLeft':
        	alertAnimationSlideLeft();
        	break;
    }
  	
  	// Animatest the amount to count up if eventType is allowed
  	if (eventQueue[0].type === 'follower') return;
    if (eventQueue[0].type === 'sub' && !eventQueue[0].bulkGifted) return;
  
  	amountCountUp();
}

/* ====================| Animation Functions |==================== */
function amountCountUp() {
	$('.text > .amount').each(function () {
    	let $this = $(this);
      	
        $({ countNum: 0 }).animate({ 
        	countNum: $this.text() 
        }, {
            duration: 1000,
            easing: 'swing',
            step: function () {
            	$this.text(Math.ceil(this.countNum));
            }, 
          	complete: function() {
            	$this.text(this.countNum);
            }
        });
  	});
}

function playAlertSound(type) {
  	if (twitch[type].sound === '') return;
  
  	let audio = new Audio(twitch[type].sound);
  	audio.volume = twitch[type].volume;
  	audio.play();
}

function playAlertTTS(type, message) {
	if (!twitch[type].hasOwnProperty('tts')) return;
  	if (!twitch[type].tts.enabled) return;
  
  	const ttsApiCall = `https://api.streamelements.com/kappa/v2/speech?voice=${twitch[type].tts.voice}&text=${message}`;
  	let audio = new Audio(ttsApiCall);
  	audio.volume = twitch[type].tts.volume;
  	
  	setTimeout(function() { audio.play() }, twitch[type].tts.delay * 1000);
}

function alertAnimationFade() {  	
	// Feed Container Animation
    feedContainer.animate({
    	opacity: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('opacity', '1');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('opacity', '0');
    alertContainer.animate({
      	opacity: '1'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

function alertAnimationSlideUp() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

function alertAnimationSlideDown() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '-100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

function alertAnimationSlideUp() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

function alertAnimationSlideRight() {  	
	// Feed Container Animation
    feedContainer.animate({
    	left: '100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('left', '0');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('left', '-100%').css('opacity', '1');
    alertContainer.animate({
      	left: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

function alertAnimationSlideLeft() {  	
	// Feed Container Animation
    feedContainer.animate({
    	left: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('left', '0');
        }, setting.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('left', '100%').css('opacity', '1');
    alertContainer.animate({
      	left: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, setting.transitionTime, function() {
            	updateEventQueue();
          	});
      	}, setting.displayTime * 1000);
	});
}

/* ====================| Getter Functions |==================== */
// Returns the label html
function getLabel(type, isAlert = false) {
  	let label 	= '';
  	let data 	= isAlert ? twitch[type] : feed[type];
  
  	if (data.hasOwnProperty('icon')) {
      	const iconType = data.hasOwnProperty('isSocial') && data.isSocial ? 'fab' : 'fas';
      
    	label = `<i class="${iconType} fa-${data.icon} icon icon-position-${fieldData.iconPosition}"></i>`;
    }
  
    if (data.hasOwnProperty('text')) {
      	label += `<span class="text">${data.text}</span>`;
    } else {      
    	switch(type) {
        	case 'host':
            case 'raid':
                label += `<span class="name">${data.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += `<span class="amount" style="margin-left:5px">${data.amount}</span>`;
                break;
            case 'follower':
                label += `<span class="name">${data.name}</span>`;
                break;
            case 'tip':
                label += `<span class="name">${data.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += `<span class="amount" style="margin-left:5px">${data.amount}</span>`;
                label += `<span class="currency">${currency.symbol}</span>`;
                break;
            case 'cheer':
                label += `<span class="name">${data.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += '<span class="currency" style="margin-left:5px">x</span>';
                label += `<span class="amount">${data.amount}</span>`;
                break;
            case 'subscriber':
                if (isAlert && data.gifted) {
                    label = `<i class="fas fa-${data.giftIcon} icon icon-position-${fieldData.iconPosition}"></i>`;
                    label += `<span class="name sender">${data.sender}</span>`;
                    label += '<i class="fas fa-angle-double-right delimeter" style="margin-left:5px;font-size:.75em;"></i>';
                    label += `<span class="name reciever" style="margin-left:5px">${data.name}</span>`;
                } else if (isAlert && data.bulkGifted) { 
                    label = `<i class="fas fa-${data.giftIcon} icon icon-position-${fieldData.iconPosition}"></i>`;
                    label += `<span class="name sender">${data.sender}</span>`;
                    label += '<span class="delimeter">:</span>';
                    label += `<span class="amount" style="margin-left:5px">${data.amount}</span>`;
               } else {
                    label += `<span class="name">${data.name}</span>`;
                    label += typeof data.amount === 'number' 
                        ? `<span class="currency" style="margin-left:5px">x</span><span class="amount">${data.amount}</span>`
                        : '';
                }
                break;
        }
    }
  
  	return label;
}