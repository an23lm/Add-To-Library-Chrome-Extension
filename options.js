// var musickitloaded = false;
// document.addEventListener('musickitloaded', function() {
// 	musickitloaded = true;
// });

window.onload = function() {
	var userToken = null;
	var developerToken = null;
	var currentState = 'unauthed';

	/// Cookie details
	const userTokenCookieDetails = {
		'url': 'https://add-to-library.appspot.com/',
		'name': 'applemusicuser'
	};
	const developerTokenCookieDetails = {
		'url': 'https://add-to-library.appspot.com/',
		'name': 'developertoken'
	}

	getCookieDetails(developerTokenCookieDetails, (token) => {
		developerToken = token;
		getCookieDetails(userTokenCookieDetails, (token) => {
			userToken = token;
			initalSetup();
		});
	});

	function getCookieDetails(details, callback) {
		chrome.cookies.get(details, function(cookie) {
			var value = null;
			if (cookie != null) {
				value = cookie.value.trim() != "" ? cookie.value : null;
			}
			callback(value);
		});
	}

	function initalSetup() {
		document.getElementById("auth-button").addEventListener("click", toggleAuth);
		document.getElementById("clear").addEventListener("click", clearLocalStorage);
		
		if (developerToken != null && userToken != null) {
			currentState = 'authed';
			document.getElementById('auth').innerHTML = "unauthorize";
			document.getElementById('auth').classList.remove("bling");
			document.getElementById('auth').classList.add("plain");
		}
	}

	function clearLocalStorage() {
		chrome.storage.local.clear(() => {
			var error = chrome.runtime.lastError;
			if (error) {
				console.error(error);
			} else {
				console.log('Cleared storage');
			}
		});
	}

	function toggleAuth() {
		if (userToken == null) {
			openAuthWindow()
		} else {
			openUnauthWindow()
		}
	}

	function openAuthWindow() {
		var win = window.open('https://add-to-library.appspot.com/auth','Authorize with Apple Music','resizable,height=500,width=600'); 
		var timer = setInterval(function() {
    		if (win.closed) {
        		clearInterval(timer);
        		didAuth();
    		}
			else {
				getCookieDetails(userTokenCookieDetails, (token) => {
					if (token != null) {
						userToken = token;
						auth();
						clearInterval(timer);
						win.close();
					}
				});
			} 
		}, 1000);
	}

	function encodeQueryData(data) {
		const ret = [];
		for (let d in data)
			ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
		return ret.join('&');
	}

	function openUnauthWindow() {
		var url = 'https://add-to-library.appspot.com/unauth';
		
		const data = {'developertoken': developerToken, 'applemusicusertoken': userToken};
		const querystring = encodeQueryData(data);

		url += "?" + querystring;

		var win = window.open(url,'Unauthorize Apple Music','resizable,height=500,width=600'); 

		var timer = setInterval(function() {
    		if (win.closed) {
        		clearInterval(timer);
        		didAuth();
    		}
			else {
				getCookieDetails(userTokenCookieDetails, (token) => {
					if (token == null) {
						userToken = token;
						unauth();
						clearInterval(timer);
						win.close();
					}
				});
			} 
		}, 1000);
	}

	function unauth() {
		currentState = 'unauthed';
		document.getElementById('auth').innerHTML = "authorize";
		document.getElementById('auth').classList.remove("plain");
		document.getElementById('auth').classList.add("bling");
		developerToken = null;

		sendMessageToBackground('authchange');
	}

	function auth() {
		currentState = 'authed';
		document.getElementById('auth').innerHTML = "unauthorize";
		document.getElementById('auth').classList.remove("bling");
		document.getElementById('auth').classList.add("plain");

		getCookieDetails(developerTokenCookieDetails, (token) => {
			developerToken = token;
		});

		sendMessageToBackground('authchange');
	}

	function didAuth() {
		getCookieDetails(userTokenCookieDetails, (token) => {
			userToken = token;
			if (token != null && currentState == 'unauthed') {
				auth();
			} else if (token == null && currentState == 'authed') {
				unauth();
			}
		});
	}

	function sendMessageToBackground(type) {
		chrome.runtime.sendMessage({type: type}, function(response) {
			// handle failed cookie save state	
			console.log(response);
		});
	}
};