console.log('sendContent.js');
    chrome.extension.sendRequest( {
            action: "content",
            host: document.location.hostname,
			referral: document.referrer,
			browser: navigator.userAgent,
			url: document.location.href
        }, function(response) { }
    );