var activeAfsrcTabs = [];
chrome.webRequest.onBeforeRedirect.addListener(function(details) {
	console.log("ON BEFORE REDIRECT:" + details.tabId);
	console.log("ON BEFORE REDIRECT:" + details.url);
	if(CheckAfsrc(details.url)==1){
		ActivateAfsrcTab(details.tabId);
	}
}, {urls: ["<all_urls>"]});



/*Checks when a tab url is updated*/
chrome.tabs.onUpdated.addListener(function(tabId, tabInfo, tab) {
	console.log("TAB Info:"+tabInfo.status);
	console.log("TAB URL:"+tab.url);
	var url = (tab.url).indexOf("fetchdeals.com");
	if( url !== -1 ) return;
	if(tabInfo.status=="loading"){
		console.log("-----ENTER IN LOADING:"+tab.url);
	}
	
	if (tabInfo.status=="complete"){
	
		chrome.tabs.executeScript(tabId, {code: "document.referrer;"}, function(response){
			var referralURL = response[0];
			chrome.tabs.executeScript(tabId, {code: "document.location.hostname;"}, function(response){
				var hostName = response[0];
				hostName = getDomain(hostName);
				chrome.tabs.executeScript(tabId, {code: "navigator.userAgent;"}, function(response){
					var browserName = response[0];
					chrome.tabs.executeScript(tabId, {code: "document.location.href;"}, function(response){
						var currentURL = response[0];
						console.log("HOST: " + hostName);
						console.log("REFERRAL: " + referralURL);
						console.log("URL: " + currentURL);
						console.log("BROWSER: " + browserName);
						
						getMerchants( function(merchantsList){
							
							hostNameMd5 =  calcMD5(hostName);
							merchantFound = "NO";
														
							//Compares current hostname with the merchant list
							for(var i=0;i<merchantsList.length;i++){
								if (hostNameMd5.toString() == merchantsList[i][0].toString()){
								
									console.log("Merchant is on list: "+merchantsList[i][1]+"---"+merchantsList[i][0]);
									var merchantID = merchantsList[i][1];
									merchantFound = "YES";
									break;
								}//if in list
							} //for
							if (merchantFound == "YES"){
								getCookies("http://www.fetchdeals.com", "fuid", function(fuidCookie) {
									getCookies("http://www.fetchdeals.com", "tb", function(tbCookie) {
										getCookies("http://www.fetchdeals.com", "lb", function(lbCookie) {
											console.log("FUID:"+fuidCookie);
											console.log("TB:"+tbCookie);
											console.log("LB:"+lbCookie);
										
											if (tbCookie[0] == 0 && hostName!="fetchdeals.com" && lbCookie[0] == 0){
										
												//chrome.tabs.query ({active: true},function(tabs) {
													
													//tabId = tabs[0].id;
													
														chrome.tabs.executeScript(tabId, {code: "var scriptOptions = {fuid:'"+fuidCookie[0]+"',mpage:'"+currentURL+"'};"}, function(){
															chrome.tabs.executeScript(tabId, {file: "scripts/bannerLogin.js", runAt:"document_end", allFrames:false}, function(){
																setSessionCookie("http://www.fetchdeals.com", "lb", "1")
																console.log ("Login banner displayed");
															});
														});
												
												//});
									
											}else{ // if member is logged in
												
												if (fuidCookie[0] == 0){
													fuidCookie[0]=generateFuidCookie();                                
												}
												if (tbCookie[0] == 0 ){
													tbCookie[0]=fuidCookie[0];
												}
												
												//postData(tbCookie[0], referralURL, currentURL, browserName);
												getLinks(hostName, tbCookie[0], function(linkData){
													console.log(linkData);
													var clickURL=linkData[0][0].toString();
													var NoAutoStatus =linkData[0][1].toString();
													
													console.log ("get Links"+clickURL+"--"+NoAutoStatus);
													
													getCookies("http://"+hostName, "fdlr", function(fdlrCookie){
														var timeInSeconds = (new Date().getTime() / 1000);
														console.log("FDLR: "+fdlrCookie[0]);
														if ((fdlrCookie[0]==1) && !(fdlrCookie[1]<timeInSeconds) ){
															
															chrome.tabs.executeScript(tabId, {code: "var scriptOptions = {mid:'"+merchantID+"'}"}, function(){
																chrome.tabs.executeScript(tabId, {file: "scripts/banner.js", runAt:"document_end", allFrames:false}, function(){
																	setCookies("http://"+hostName, "2"); // Banner
																	console.log ("Redirected banner displayed");
																});
															});
															
															
														
														}//else{
															NoAuto = CheckAutoRedirect(currentURL, referralURL);
															if(IsActiveAfsrcTab(tabId)==1){
																NoAuto=1;
																DeactivateAfsrcTab(tabId);
															}
															console.log("NOauto= "+NoAuto);
															
															// auto redirect when the cookie is 0 and noAuto =0
															if (( fdlrCookie[0]==0 || fdlrCookie[1]<timeInSeconds ) && (NoAuto==0 && NoAutoStatus==0)){
																console.log("Redirecting");
																setCookies("http://"+hostName, "1"); //Redirected 
																chrome.tabs.update({url: clickURL}); 
															}
															
															// show click banner
															if (( fdlrCookie[0]==0 || fdlrCookie[1]<timeInSeconds ) && (NoAuto==1 || NoAutoStatus==1)){
																
																chrome.tabs.executeScript(tabId, {code: "var scriptOptions = {mid:'"+merchantID+"', memid:'"+tbCookie[0]+"'}"}, function(){
																	chrome.tabs.executeScript(tabId, {file: "scripts/bannerNoAuto.js", runAt:"document_end", allFrames:false}, function(){
																		setCookies("http://"+hostName, "3"); // Banner
																		console.log ("Click banner displayed");
																	});
																});
																  
															}
															
															if (fdlrCookie[0]==3 && !(fdlrCookie[1]<timeInSeconds)){
																
																getBannerClick(merchantID,tbCookie[0], function(response){
																	console.log("SHOW SECOND BANNER RESPNSE:"+response);  
																	if (response =="Updated to 0"){ //banner one displayed and click
																		chrome.tabs.executeScript(tabId, {code: "var scriptOptions = {mid:'"+merchantID+"', memid:'"+tbCookie[0]+"'}"}, function(){
																			chrome.tabs.executeScript(tabId, {file: "scripts/bannerNoAuto2.js", runAt:"document_end", allFrames:false}, function(){
																				setCookies("http://"+hostName, "4"); // Banner
																				console.log ("Congrats banner displayed");
																			});
																		});
																	}//if
																
																});//bannerclick
															}
														
														//}
														
														
													});			
													                                                             
													
													
												
												});
												
											}
										});
									});
								
								});
							}
							
						});// getMerchants
					});
				
				});
				
				
				
			});
			
		});
		//		
	}

});

//------Checks if the current tab is activated by afsrc=1
function IsActiveAfsrcTab(tabId){
     if (activeAfsrcTabs.indexOf(tabId) != -1){
         return 1;
     }else{
         return 0;
     }
};
//------Deactivate current tab after is used by afsrc=1
function DeactivateAfsrcTab(tabId){
    var index = activeAfsrcTabs.indexOf(tabId);
    activeAfsrcTabs.splice(index, 1);
    console.log("Array after deactivate: "+activeAfsrcTabs);
};
//------Activate current tab if afsrc=1
function ActivateAfsrcTab(tabId){
     if (activeAfsrcTabs.indexOf(tabId) == -1){
         activeAfsrcTabs.splice(-1,0,tabId);
     }
     console.log("Array after activate: "+activeAfsrcTabs);
};
//------Checks if current URL has afsrc = 1
function CheckAfsrc(currentURL){
    findAfsrc = currentURL.search(/afsrc=1/i);
    if (findAfsrc!=-1){
        return 1;
    }else{
        return 0;
    }
};




function getDomain(url){
    url = url.split(".");
    var hostName = "";
    if (url.length !=2){
        for(var i = url.length-1; i>0; i--){
            if (hostName==""){ 
                hostName=url[url.length -i];
            }else{
                hostName=hostName+"."+url[url.length -i];
            }
        }
    }else{
        hostName=url[url.length -2]+"."+url[url.length -1];
    }
    console.log("DOMAIN NAME: "+hostName);    
    return hostName;
};


function getCookies(domain, name, callback) {
    var data = new Array();
	chrome.cookies.get({"url": domain, "name": name}, function(cookie) {
        if(callback) {
			if (cookie != null){ 
				data[0] = cookie.value;
				data[1] = cookie.expirationDate;
			}else{
				data[0] = 0;
				data[1] = 0;
			}		
			//console.log("COOKIE: " + data);
			callback(data);
			
        }
    });
	
};
function setSessionCookie(domain, cName, cValue){
	chrome.cookies.set({ url: domain, name: cName, value: cValue});
};


function setCookies(domain, cValue){
	var expSeconds = (new Date().getTime() / 1000)+21600; //6 hours
	chrome.cookies.set({ url: domain, name: "fdlr", value: cValue, expirationDate: expSeconds });
};

function generateFuidCookie(){
    var fuid="";
    var c="bcdfghjklmnprstvwxyz".split("");
    var v="aeiou".split("");
    var now = new Date();
    fuid = c[Math.floor(Math.random() * (20))];
    fuid = fuid + Math.floor(Math.random() * (9999));
    fuid = fuid + v[Math.floor(Math.random() * (5))];
    fuid = fuid + c[Math.floor(Math.random() * (20))];
    fuid = fuid + v[Math.floor(Math.random() * (5))];
    fuid = fuid + c[Math.floor(Math.random() * (20))];
    fuid = fuid + Math.floor(Math.random() * (999999));
    fuid = fuid + now.getFullYear()+ (now.getMonth()+1) + now.getDate() + now.getHours()+ now.getMinutes() + now.getSeconds();
    fuid = "G" + fuid;
    console.log("NEW FUID:"+fuid);
    
    var expSeconds = (new Date().getTime() / 1000)+86400;
	chrome.cookies.set({ url: "http://www.fetchdeals.com", name: "fuid", value: fuid, expirationDate: expSeconds });
    return (fuid);
         
};
/*Check if the merchant URL has properties to autoredirect or not*/
function CheckAutoRedirect(currentURL, referralURL){
    
    findGoogle = referralURL.search(/.google./i);
    findAclk = referralURL.search(/aclk/i);
    findAfsrc = currentURL.search(/afsrc=1/i);
    
    if (((findGoogle!=-1)&&(findAclk!=-1))|| (findAfsrc!=-1)){
    
        return 1;
    }else{
        return 0;
    }
    
    console.log("FIND GOOGLE: "+findGoogle); 
    console.log("FIND ACLK: "+findAclk); 
    console.log("FIND AFSRC: "+findAfsrc); 
    
};

/* Get data if the banner was clicked*/
function getBannerClick(merchantId, memberId, callback){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://raquel.dwalliance.com/fetchdeals/api_set_bannerclick.php?merid="+merchantId+"&mid="+memberId+"&from_addon=y", true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			var data = xhr.responseText;
			callback(data);
		  } else {
			callback(null);
		  }
	  }
	}
xhr.send();

};


/* Get the list of all merchants in MD5*/
function getMerchants(callback){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://raquel.dwalliance.com/fetchdeals/api_get_affiliates.php", true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			var data = JSON.parse(xhr.responseText);
			callback(data);
		  } else {
			callback(null);
		  }
	  }
	}
xhr.send();

};
/* Get redirect link of a specific merchant*/
function getLinks(hostName, memberId, callback){
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "http://raquel.dwalliance.com/fetchdeals/api_get_offerslink.php?murl="+hostName+"&mid="+memberId, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			var data = JSON.parse(xhr.responseText);
			callback(data);
		  } else {
			callback(null);
		  }
	  }
	}
	xhr.send();

};

function postData(tbCookie, referralURL, URL, browserName){
    
    var MemberUID = tbCookie;
    var BrowserName=browserName;
    var ReferralURL= referralURL;
    
    //console.log("Member="+MemberUID);
    
	var post_url = "http://raquel.dwalliance.com/log.php?";
	post_url = post_url + "&Browser=" + BrowserName;
    post_url = post_url + "&URL=" + URL;
	post_url = post_url + "&ReferralURL=" + ReferralURL;
	post_url = post_url + "&MemberUID=" + MemberUID;
    
    var xhr = new XMLHttpRequest();
	xhr.open("GET", post_url, true);
	xhr.onreadystatechange = function() {
	  if (xhr.readyState == 4) {
		if (xhr.status == 200) {
			var data = xhr.responseText;
			//callback(data);
			console.log("POSTDATA Successful: " + data);
		  } else {
			console.log("POSTDATA Unsuccessful: " + data);
			//callback(null);
		  }
	  }
	}
	xhr.send();
    
};





/*MD5 functions from here****************************************************************************************************/
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Copyright (C) Paul Johnston 1999 - 2000.
 * Updated by Greg Holt 2000 - 2001.
 * See http://pajhome.org.uk/site/legal.html for details.
 */

/*
 * Convert a 32-bit number to a hex string with ls-byte first
 */
var hex_chr = "0123456789abcdef";
function rhex(num)
{
  str = "";
  for(j = 0; j <= 3; j++)
    str += hex_chr.charAt((num >> (j * 8 + 4)) & 0x0F) +
           hex_chr.charAt((num >> (j * 8)) & 0x0F);
  return str;
}

/*
 * Convert a string to a sequence of 16-word blocks, stored as an array.
 * Append padding bits and the length, as described in the MD5 standard.
 */
function str2blks_MD5(str)
{
  nblk = ((str.length + 8) >> 6) + 1;
  blks = new Array(nblk * 16);
  for(i = 0; i < nblk * 16; i++) blks[i] = 0;
  for(i = 0; i < str.length; i++)
    blks[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8);
  blks[i >> 2] |= 0x80 << ((i % 4) * 8);
  blks[nblk * 16 - 2] = str.length * 8;
  return blks;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally 
 * to work around bugs in some JS interpreters.
 */
function add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

/*
 * These functions implement the basic operation for each round of the
 * algorithm.
 */
function cmn(q, a, b, x, s, t)
{
  return add(rol(add(add(a, q), add(x, t)), s), b);
}
function ff(a, b, c, d, x, s, t)
{
  return cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function gg(a, b, c, d, x, s, t)
{
  return cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function hh(a, b, c, d, x, s, t)
{
  return cmn(b ^ c ^ d, a, b, x, s, t);
}
function ii(a, b, c, d, x, s, t)
{
  return cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Take a string and return the hex representation of its MD5.
 */
function calcMD5(str)
{
  x = str2blks_MD5(str);
  a =  1732584193;
  b = -271733879;
  c = -1732584194;
  d =  271733878;

  for(i = 0; i < x.length; i += 16)
  {
    olda = a;
    oldb = b;
    oldc = c;
    oldd = d;

    a = ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = ff(c, d, a, b, x[i+10], 17, -42063);
    b = ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = ff(d, a, b, c, x[i+13], 12, -40341101);
    c = ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = ff(b, c, d, a, x[i+15], 22,  1236535329);    

    a = gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = gg(c, d, a, b, x[i+11], 14,  643717713);
    b = gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = gg(c, d, a, b, x[i+15], 14, -660478335);
    b = gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = gg(b, c, d, a, x[i+12], 20, -1926607734);
    
    a = hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = hh(b, c, d, a, x[i+14], 23, -35309556);
    a = hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = hh(d, a, b, c, x[i+12], 11, -421815835);
    c = hh(c, d, a, b, x[i+15], 16,  530742520);
    b = hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = ii(c, d, a, b, x[i+10], 15, -1051523);
    b = ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = ii(d, a, b, c, x[i+15], 10, -30611744);
    c = ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = add(a, olda);
    b = add(b, oldb);
    c = add(c, oldc);
    d = add(d, oldd);
  }
  return rhex(a) + rhex(b) + rhex(c) + rhex(d);
};

