// Neohud v1.2 by Neoshin
// Variables
let setting = {
    'displayTime': 5, 			// Seconds
  	'transitionTime': 600,		// Milliseconds
  	'alertAnimation': 'slideUp',
  	'customLabelsCount': 3
};
let state = {
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
      	'bulkGifted': false
    },
  	'tip': {
    	'icon': 'dollar-sign',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0
    },
  	'cheer': {
    	'icon': 'gem',
      	'name': '',
      	'placeholder': '',
      	'sound': '',
      	'volume': 1,
      	'amount': 0
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
let customLabels 		= {};
let channelName 		= '';
let currency 			= {};
let data 				= {};
let fieldData 			= {};
let latestLoop 			= {};
let eventQueue			= [];
const loopContainer		= $('.loop-container');
const loopText			= loopContainer.children('.text');
const alertContainer	= $('.alert-container');
const alertText			= alertContainer.children('.text');

// On Widget Load
window.addEventListener('onWidgetLoad', function(obj) {	
  	// Update Variables
  	channelName = obj.detail.channel.username;
  	currency 	= obj.detail.currency;
  	data 		= obj.detail.session.data;
  	fieldData 	= obj.detail.fieldData;
  	
  	// Update Objects
  	updateStyles();
  	updateSetting();
  	updateCustomLabels();
  	updateState();
  	updateLoop();
  	
  	// Run the latest loop
  	latestLabelLoop();
});

// On Session Update
window.addEventListener('onSessionUpdate', function(obj) {  
  	// Update Variables
	data = obj.detail.session;
  
  	// Update Objects
  	updateSetting();
  	updateState();
  	updateLoop();
  
  	// Runs an alert if triggered
  	if (eventQueue.length > 0 && eventQueue.length < 2) {
    	runAlert();
    }
});

// On Event Received
window.addEventListener('onEventReceived', function (obj) {
  	// Variables
  	const eventListener = obj.detail.listener;
  	const eventData = obj.detail.event;
  
  	if (eventListener.includes('latest')) {
      	const eventObj = {
        	'type': eventListener.replace('-latest', ''),
          	'name': eventData.name,
          	'amount': eventData.amount,
          	'tier': eventData.tier,
          	'sender': eventData.sender,
          	'gifted': eventData.gifted,
          	'bulkGifted': eventData.bulkGifted
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

// Updates the custom labels
function updateCustomLabels() {
  	for (let x = 1; x < setting.customLabelsCount + 1; x++) {
    	if (fieldData.hasOwnProperty(`customLabel${x}`) && fieldData[`customLabel${x}`] !== '') {
        	customLabels[`customLabel${x}`] = {
                'showLabel': true,
                'text': fieldData[`customLabel${x}`]
            }
        }
    }
}

// Updates the state object with the current available data
function updateState() {
	const stateKeys = Object.keys(state);
  
  	stateKeys.forEach(key => {
    	state[key].icon = fieldData[key + 'Icon'];													// Icon
      	state[key].sound = fieldData[key + 'Sound'];												// Sound
      	state[key].volume = fieldData[key + 'Volume'] / 100;										// Volume
      	state[key].name = data[key + '-latest'].name === '' 										// Name
              	? state[key].placeholder 
            	: data[key + '-latest'].name;
      
      	if (state[key].hasOwnProperty('giftIcon')) {
        	state[key].giftIcon = fieldData[key + 'GiftIcon'];										// Gift Icon
        }
      
      	if (state[key].hasOwnProperty('placeholder')) {
        	state[key].placeholder = fieldData[key + 'Placeholder'];								// Placeholder
        }
      
      	if (state[key].hasOwnProperty('amount')) {
        	state[key].amount = data[key + '-latest'].amount;										// Amount
        }
      
      	if (state[key].hasOwnProperty('tier')) {
        	state[key].tier = data[key + '-latest'].tier;											// Subtier
        }
    });
}

// Updates the loops with the enabled labels
function updateLoop() {
  	const stateKeys = Object.keys(state);
  	const customLabelsKeys = Object.keys(customLabels);

  	stateKeys.forEach(key => {
      	if (fieldData.hasOwnProperty(key + 'Latest') && fieldData[key + 'Latest'] === 'true') {
        	latestLoop[key] = state[key];
        }
    });
  
  	customLabelsKeys.forEach(key => {
      	if (customLabels[key].showLabel) {
        	latestLoop[key] = customLabels[key];
          	latestLoop[key].isCustom = true;
        }
    });
}

/* ====================| Looping Functions |==================== */
// Displays all the enabled latest labels in a loop
function latestLabelLoop() {
  	const latestKeys = Object.keys(latestLoop);
  	
  	if(latestKeys.length < 1) return;
  
    let latestPos		= 0;
    let latestType 		= latestKeys[latestPos];
  	
    if (latestKeys.length < 2) {
      	loopText.html(getLabel(latestType));
	} else {
      	setInterval(function() {
          	if (eventQueue.length > 0) {
              	loopText.html(getLabel(eventQueue[0].type));
      			latestPos = latestKeys.indexOf(eventQueue[0].type) + 1;  	
            } else {
            	latestType = latestKeys[latestPos];
			
                loopContainer.fadeOut(setting.transitionTime, function() {
                    loopText.html(getLabel(latestType));
                    loopContainer.fadeIn();
                });

                latestPos++;
            }
          
          	if (latestPos == latestKeys.length) {
              	latestPos = 0;
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
    alertText.html(getLabel(eventQueue[0].type));
  	
  	// Plays the alert sound
  	playAlertSound(eventQueue[0].type);

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
  	if (state[type].sound === '') return;
  
  	let audio = new Audio(state[type].sound);
  	audio.volume = state[type].volume;
  	audio.play();
}

function alertAnimationFade() {  	
	// Loop Container Animation
    loopContainer.animate({
    	opacity: '0'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('opacity', '1');
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
	// Loop Container Animation
    loopContainer.animate({
    	top: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('top', '0');
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
	// Loop Container Animation
    loopContainer.animate({
    	top: '100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('top', '0');
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
	// Loop Container Animation
    loopContainer.animate({
    	top: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('top', '0');
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
	// Loop Container Animation
    loopContainer.animate({
    	left: '100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('left', '0');
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
	// Loop Container Animation
    loopContainer.animate({
    	left: '-100%'
    }, setting.transitionTime, function() {
        setTimeout(function() {
        	loopContainer.css('left', '0');
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
function getLabel(type) {
  	let isAlert = false;
  	let stateObject = latestLoop[type];
  	let label = '';
  
  	// If is event then replace with event data
  	if (eventQueue.length > 0) {
      	isAlert 				= true;
      	stateObject 			= state[type];
    	stateObject.name 		= eventQueue[0].name;
      	stateObject.amount 		= eventQueue[0].amount;
		stateObject.tier		= eventQueue[0].tier;
      	stateObject.sender		= eventQueue[0].sender;
      	stateObject.gifted		= eventQueue[0].gifted;
      	stateObject.bulkGifted	= eventQueue[0].bulkGifted;
    }
  
  	if (stateObject.hasOwnProperty('icon')) {
    	label = `<i class="fas fa-${stateObject.icon} icon icon-position-${fieldData.iconPosition}"></i>`;
    }
  
    if (stateObject.hasOwnProperty('isCustom') && stateObject.isCustom) {
      	label += `<span class="text">${stateObject.text}</span>`;
    } else {
    	switch(type) {
        	case 'host':
            case 'raid':
                label += `<span class="name">${stateObject.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += `<span class="amount" style="margin-left:5px">${stateObject.amount}</span>`;
                break;
            case 'follower':
                label += `<span class="name">${stateObject.name}</span>`;
                break;
            case 'tip':
                label += `<span class="name">${stateObject.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += `<span class="amount" style="margin-left:5px">${stateObject.amount}</span>`;
                label += `<span class="currency">${currency.symbol}</span>`;
                break;
            case 'cheer':
                label += `<span class="name">${stateObject.name}</span>`;
                label += '<span class="delimeter">:</span>';
                label += '<span class="currency" style="margin-left:5px">x</span>';
                label += `<span class="amount">${stateObject.amount}</span>`;
                break;
            case 'subscriber':
                if (isAlert && stateObject.gifted) {
                    label = `<i class="fas fa-${stateObject.giftIcon} icon icon-position-${fieldData.iconPosition}"></i>`;
                    label += `<span class="name sender">${stateObject.sender}</span>`;
                    label += '<i class="fas fa-angle-double-right delimeter" style="margin-left:5px;font-size:.75em;"></i>';
                    label += `<span class="name reciever" style="margin-left:5px">${stateObject.name}</span>`;
                } else if (isAlert && stateObject.bulkGifted) { 
                    label = `<i class="fas fa-${stateObject.giftIcon} icon icon-position-${fieldData.iconPosition}"></i>`;
                    label += `<span class="name sender">${stateObject.sender}</span>`;
                    label += '<span class="delimeter">:</span>';
                    label += `<span class="amount" style="margin-left:5px">${stateObject.amount}</span>`;
               } else {
                    label += `<span class="name">${stateObject.name}</span>`;
                    label += typeof stateObject.amount === 'number' 
                        ? `<span class="currency" style="margin-left:5px">x</span><span class="amount">${stateObject.amount}</span>`
                        : '';
                }
                break;
        }
    }
  
  	return label;
}