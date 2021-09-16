// Neohud v2.0 by Neoshin#1871

// Variables
let channelName = '';
let sessionData	= {};
let fieldData	= {};
let currency	= {};
let feed		= {};
let feedPos		= 0;
let isEvent		= false;
let eventData	= {};

// HTML Elements
const widgetContainer		= $('.widget-container');
const feedContainer			= $('.feed-container');
const feedContentWrapper	= feedContainer.children('.content-wrapper');
const alertContainer		= $('.alert-container');
const alertContentWrapper	= alertContainer.children('.content-wrapper');

/* ====================| Event Listener |==================== */
// On Widget Load
window.addEventListener('onWidgetLoad', function(obj) {
  	channelName = obj.detail.channel.username;
  	sessionData	= obj.detail.session.data;
  	fieldData	= obj.detail.fieldData;
  	currency	= obj.detail.currency;
  	
  	updateCSSVars();
  	updateElementClasses();
  	updateFeed();
  	runFeed();
});

// On Session Update
window.addEventListener('onSessionUpdate', function(obj) {
  	const session = obj.detail;
  	
  	if (sessionData.hasOwnProperty(session.type)) {
    	Object.assign(sessionData, session);
    }	
  
  	updateCSSVars();
  	updateFeed();
});

// On Event Received
window.addEventListener('onEventReceived', function (obj) {
  	const type = obj.detail.listener;
  	const event = obj.detail.event;
  
  	runAlert(type, event);
});

/* ====================| Operational Functions |==================== */
// Runs the feed
function runFeed() {
  	if(Object.keys(feed).length < 1) return;
  
    setInterval(function() {
    	const labelKeys 	= Object.keys(feed);
        const labelKey 		= labelKeys[feedPos];
        const labelKeySplit	= labelKey.split("-");
        let labelType		= labelKeySplit[0];
        let labelField		= labelKeySplit[1] ? labelKeySplit[1] : false;

        if (isEvent) {
            if (labelType === eventData.type) {
            	feedPos++;
            }

            labelType 	= eventData.type;
            labelField 	= 'latest';
        }

        const labelHTML = getLabel(labelType, labelField);

        if (labelKeys.length > 1 || isEvent) {
            feedContainer.fadeOut(fieldData.transitionTime, function() {
                feedContentWrapper.html(labelHTML);
                preventContentOverflow(labelHTML);
                feedContainer.fadeIn();
              	
              	if (labelField === 'goal') amountCountUp();
            });

        	feedPos++;
        } else {
        	feedContentWrapper.html(labelHTML);
            preventContentOverflow(labelHTML);
        }

        isEvent = false;

        if (feedPos >= labelKeys.length) {
        	feedPos = 0;
        }
    }, fieldData.displayTime * 1000);
}

function preventContentOverflow(el) {
  	/// Creating a hidden clone to get the width
  	const clone 		= $(el).clone();
  	const cloneWrapper	= clone.children('.text-wrapper');
  	const cloneText		= cloneWrapper.children('.text');
  	const text			= widgetContainer.find('.content').children('.text-wrapper').children('.text');
  
  	clone.css('visibility', 'hidden');
  	widgetContainer.append(clone);
  
  	// Calculating if text content is overflowing
  	let overlap = Math.floor(cloneWrapper.width() - cloneText.width());
  
  	if (overlap < 0) {
      	const r = document.querySelector(':root');
      	overlap = overlap + 'px';
    
      	r.style.setProperty('--text-width-overlap', overlap);
    	text.addClass('back-and-forth');
    }
}

// Runs an alert if the triggered event is enabled
function runAlert(type, event) {
  	if (!type.includes('-latest') 
        || fieldData[`${event.type}Alert`] === 'false' 
        || ( event.hasOwnProperty('isCommunityGift') && event.isCommunityGift )
       ) {
    	SE_API.resumeQueue();
      	return;
    };
  	
  	isEvent = true;
  	eventData = event;
  	sessionData[type] = event;	
  
  	playAlertSound(event.type);
  	playAlertAnimation(event);
  	amountCountUp();
  	setTimeout(SE_API.resumeQueue, fieldData.displayTime * 1000 );
}

// Plays the alert sound if set
function playAlertSound(type) {
  	if (!fieldData[`${type}AlertSound`]) return;
  
  	const audio = new Audio(fieldData[`${type}AlertSound`]);
  	audio.volume = fieldData[`${type}AlertVolume`] / 100;
  	audio.play();
}

// Plays the alert animation
function playAlertAnimation(event) {
  	alertContentWrapper.html(getLabel(event.type, 'latest'));
  
    switch(fieldData.alertAnimation) {
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
}

/* ====================| Update Functions |==================== */
// Updates CSS variables
function updateCSSVars() {
  	const r 					= document.querySelector(':root');
  	const followerGoalWidth 	= (sessionData['follower-goal'].amount / fieldData.followerGoalAmount) * 100 + '%';
  	const subscriberGoalWidth 	= (sessionData['subscriber-goal'].amount / fieldData.subscriberGoalAmount) * 100 + '%';
  	const tipGoalWidth 			= (sessionData['tip-goal'].amount / fieldData.tipGoalAmount) * 100 + '%';
  	const cheerGoalWidth 		= (sessionData['cheer-goal'].amount / fieldData.cheerGoalAmount) * 100 + '%';
  
  	r.style.setProperty('--follower-goal-width', followerGoalWidth);
  	r.style.setProperty('--subscriber-goal-width', subscriberGoalWidth);
  	r.style.setProperty('--tip-goal-width', tipGoalWidth);
  	r.style.setProperty('--cheer-goal-width', cheerGoalWidth);
}

// Updates the HTML elements with style classes
function updateElementClasses() {
  	widgetContainer.addClass(`icon-align-${fieldData.iconAlignment}`);
  	widgetContainer.addClass(`background-style-${fieldData.backgroundStyle}`);
  	alertContainer.addClass(`background-style-${fieldData.backgroundStyleAlert}`);
}

// Updates the feed array
function updateFeed() {
	addTwitchLabels();
  	addSocialLabels();
  	addCustomLabels();
}

// Adds twitch specific labels to the feed
function addTwitchLabels() {
	const types = ['follower', 'subscriber', 'tip', 'cheer', 'host', 'raid'];
  	const fields = ['Latest', 'Top', 'Count', 'Goal'];
	
  	for (const type of types) {
    	for (let field of fields) {
        	if (fieldData.hasOwnProperty(type + field) && fieldData[type + field] !== 'false') {
              	field = field.toLowerCase();
              	feed[`${type}-${field}`] = getLabel(type, field);
            }
        }
    }
}

function addSocialLabels() {
	const plattforms = ['twitch', 'youtube', 'tiktok', 'instagram', 'twitter', 'facebook'];
  	
  	for (const plattform of plattforms) {
    	if (fieldData[plattform]) {
        	feed[plattform] = getSocialLabel(plattform);
        }
    }
}

function addCustomLabels() {
	const amount = 3;
  	
  	for (let num = 1; num <= amount; num++) {
    	if (fieldData[`custom${num}`]) {
        	feed[`custom-${num}`] = getCustomLabel(num);
        }
    }
}

/* ====================| Getter Functions |==================== */
// Returns the correct label string to the provided label type
function getLabel(type, field) {
  	switch (type) {
    	case 'twitch':
        case 'youtube':
        case 'tiktok':
        case 'instagram':
        case 'twitter':
        case 'facebook':
        	return getSocialLabel(type);
        	break;
      	case 'custom':
        	return getCustomLabel(field);
        	break;
    }
  
	if (field) {
    	switch (field) {
          case 'latest':
              return getLatestLabel(type);
              break;
          case 'top':
              return getTopLabel(type);
              break;
          case 'count':
              return getCountLabel(type);
              break;
          case 'goal':
              return getGoalLabel(type);
              break;
    	}
    }
}

// Returns a string with the latest label
function getLatestLabel(type) {
  	let content = `<div class="content" data-label-type="${type}" data-label-field="latest">`;
  	let data 	= sessionData[`${type}-latest`];
  	
  	content += getIcon(fieldData[`${type}Icon`]);
  	content += '<div class="text-wrapper"><div class="text">';
  
	switch (type) {
    	case 'follower':
        	if (data.name) {
              	const msgData = {name: `<span class="name">${data.name}</span>`};  
              
        		content += getMessageFromTemplate('followerLatest', msgData);
            } else {
            	content += 'No Followers 🙁';
            }
        	break;
        case 'subscriber':  
        	if (data.name) {
              	if (data.hasOwnProperty('bulkGifted') && data.bulkGifted) {                   
                  	const msgData = {
                    	name: `<span class="sender">${data.sender}</span>`,
                      	icon: '<i class="fas fa-gift icon" style="margin:0 5px"></i>',
                      	amount: `<span class="amount">${data.amount}</span>`
                    };
                  
                    content += getMessageFromTemplate('subscriberLatestCommunityGift', msgData);
                } else if (data.hasOwnProperty('gifted') && data.gifted) {
                  	const msgData = {
                    	sender: `<span class="sender">${data.sender}</span>`,
                      	icon: '<i class="fas fa-gift icon" style="margin:0 5px"></i>',
                      	name: `<span class="name">${data.name}</span>`
                    };
                  
                    content += getMessageFromTemplate('subscriberLatestGift', msgData);
                } else {                  
                  	const msgData = {
                    	name: `<span class="name">${data.name}</span>`,
                      	icon: '<i class="fas fa-calendar icon" style="margin:0 5px"></i>',
                      	months: `<span class="months">${data.amount}</span>`
                    };
                  
                    content += getMessageFromTemplate('subscriberLatest', msgData);
                }
            } else {
            	content += 'No Subs 🙁';
            }
        	break;
      	case 'tip':    
        	if (data.name) {
            	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`,
                    currency: `<span class="currency">${currency.symbol}</span>`
                };  

                content += getMessageFromTemplate('tipLatest', msgData);
            } else {
            	content += 'No Tips 🙁';
            }
        	break;
      	case 'cheer': 
        	if (data.name) {              
              	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`
                };  

                content += getMessageFromTemplate('cheerLatest', msgData);
            } else {
            	content += 'No Cheers 🙁';
            }
        	break;
        case 'host':    
        	if (data.name) {
            	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`
                };  

                content += getMessageFromTemplate('hostLatest', msgData);
            } else {
            	content += 'No Hosts 🙁';
            }
        	break;
        case 'raid':    
        	if (data.name) {
            	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`
                };  

                content += getMessageFromTemplate('raidLatest', msgData);
            } else {
            	content += 'No Raids 🙁';
            }
        	break;
    }
  	
  	content += '</div></div></div>';
  
  	return content;
}

// Returns a string with the top label
function getTopLabel(type) {
	let content 	= `<div class="content" data-label-type="${type}" data-label-field="top">`;
  	const period 	= fieldData[`${type}Top`];
  	let data		= sessionData[`${type}-${period}-top-donator`]
  	
  	content += getIcon(fieldData[`${type}Icon`]);
  	content += '<div class="text-wrapper"><div class="text">';
  
	switch (type) {
        case 'subscriber':
        	data = sessionData['subscriber-alltime-gifter'];
            
        	if (data.name) {
              	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                  	icon: '<i class="fas fa-gift icon" style="margin:0 5px"></i>',
                    amount: `<span class="amount">${getFormatedNumber(data.amount)}</span>`
                };  

                content += getMessageFromTemplate('subscriberTop', msgData);
            } else {
            	content += 'No Gifter 🙁';
            }
        	break;
      	case 'tip':
        	if (data.name) {              
              	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`,
                  	currency: `<span class="currency">${currency.symbol}</span>`
                };  

                content += getMessageFromTemplate('tipTop', msgData);
            } else {
            	content += 'No Tips 🙁';
            }
        	break;
      	case 'cheer':        
        	if (data.name) {              
              	const msgData = {
                    name: `<span class="name">${data.name}</span>`,
                    amount: `<span class="amount" style="margin-left:5px">${getFormatedNumber(data.amount)}</span>`
                };  

                content += getMessageFromTemplate('cheerTop', msgData);
            } else {
            	content += 'No Cheers 🙁';
            }
        	break;
    }
  
  	content += '</div></div></div>';
  
  	return content;
}

// Returns a string with the count label
function getCountLabel(type) {
	let content 	= `<div class="content" data-label-type="${type}" data-label-field="count">`;
  	const period 	= fieldData[`${type}Count`];
  	let data 		= sessionData[`${type}-${period}`];
  	
  	content += getIcon(fieldData[`${type}Icon`]);
  	content += '<div class="text-wrapper"><div class="text">';
  
	switch (type) {
    	case 'follower':
        	content += `<span class="amount">${getFormatedNumber(data.count)}</span>`;
        	break;
        case 'subscriber':
        	content += `<span class="amount">${getFormatedNumber(data.amount)}</span>`;
        	break;
        case 'tip':        	
        	content += `<span class="amount">${getFormatedNumber(data.amount)}</span>`;
        	content += `<span class="currency">${currency.symbol}</span>`;
        	break;
        case 'cheer':
        	content += `<span class="amount">${getFormatedNumber(data.amount)}</span>`;
        	break;
    }
  
  	content += '</div></div></div>';
  
  	return content;
}

// Returns a string with the goal label
function getGoalLabel(type) {
	let content 	= '<div class="content';
  	let progress 	= getFormatedNumber(sessionData[`${type}-goal`].amount);
  	let goal		= getFormatedNumber(fieldData[`${type}GoalAmount`]);
  	const alignment	= fieldData[`${type}GoalAlignment`];
  	
  	content += ` text-align-${alignment}`;
  
  	if (fieldData[`${type}GoalFillStyle`] !== 'false') {
      	const fillStyle = fieldData[`${type}GoalFillStyle`];
    	content += ` fill-style-${fillStyle}`;
    }
        
    content += `" data-label-type="${type}" data-label-field="goal">`;
  	content += getIcon(fieldData[`${type}Icon`]);
  	content += '<div class="text-wrapper"><div class="text">';
  	
  	if (fieldData[`${type}GoalTitle`]) {
      	const title = fieldData[`${type}GoalTitle`];
    	content += `<div class="goal-title">${title}</div>`;
    }
  
  	content += '<div class="goal-progress">';
  	content += `<span class="progress amount">${progress}</span>`;
  	content += type === 'tip' ? `<span class="currency">${currency.symbol}</span>` : '';
  	content += '<span class="delimeter" style="margin:0 5px">/</span>';
  	content += `<span class="goal">${goal}</span>`;
  	content += type === 'tip' ? `<span class="currency">${currency.symbol}</span>` : '';
  	content += '</div></div></div></div>';
  
  	return content;
}

// Returns a string with social label content
function getSocialLabel(plattform) {
	let content = `<div class="content" data-label-type="${plattform}">`;
  	const name = fieldData[plattform];
  
  	content += getIcon(plattform, 'fab');
  	content += '<div class="text-wrapper"><div class="text">';
  	content += `<span class="name">${name}</span>`;
  	content += '</div></div></div>';	
  
  	return content;
}

// Returns a string with custom label content
function getCustomLabel(num) {
	let content = `<div class="content" data-label-type="custom" data-label-field="${num}">`;
  	const text = fieldData[`custom${num}`];
  	
  	content += '<div class="text-wrapper">';
  	content += `<div class="text">${text}</div>`;
  	content += '</div></div>';
  
  	return content;
}

// Returns a string with the label icon
function getIcon(name = '', type = 'fas') {
  	if (!name) return '';
  
	return `<i class="${type} fa-${name} icon"></i>`;
}

function getFormatedNumber(number) {                                                                        
	return number;
}

function getMessageFromTemplate(type, data) {
	let message = fieldData[`${type}Message`];
  	
  	for (const [key, value] of Object.entries(data)) {
    	const template = `{${key}}`;
      	message = message.replaceAll(template, value);
    }
  	
  	return message;
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

function alertAnimationFade() {	
	// Feed Container Animation
    feedContainer.animate({
    	opacity: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('opacity', '1');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('opacity', '0');
    alertContainer.animate({
      	opacity: '1'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}

function alertAnimationSlideUp() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '-100%'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}

function alertAnimationSlideDown() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '100%'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '-100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}

function alertAnimationSlideUp() {  	
	// Feed Container Animation
    feedContainer.animate({
    	top: '-100%'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('top', '0');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('top', '100%').css('opacity', '1');
    alertContainer.animate({
      	top: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}

function alertAnimationSlideRight() {  	
	// Feed Container Animation
    feedContainer.animate({
    	left: '100%'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('left', '0');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('left', '-100%').css('opacity', '1');
    alertContainer.animate({
      	left: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}

function alertAnimationSlideLeft() {  	
	// Feed Container Animation
    feedContainer.animate({
    	left: '-100%'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	feedContainer.css('left', '0');
        }, fieldData.transitionTime);
    });

    // Alert Container Animation
  	alertContainer.css('left', '100%').css('opacity', '1');
    alertContainer.animate({
      	left: '0'
    }, fieldData.transitionTime, function() {
        setTimeout(function() {
        	alertContainer.animate({
            	opacity: '0'
          	}, fieldData.transitionTime);
      	}, fieldData.displayTime * 1000);
	});
}