var musickitloaded = false;
document.addEventListener('musickitloaded', function() {
	musickitloaded = true;
});

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
		if (developerToken == null) {
			getCookieDetails(userTokenCookieDetails, (token) => {
				userToken = token;
				initalSetup();
			});
		} else {
			var waitInterval = setInterval(() => {
				if (musickitloaded) {
					clearInterval(waitInterval);
					setupMusicKit();
					getCookieDetails(userTokenCookieDetails, (token) => {
						userToken = token;
						initalSetup();
					});
				}
			}, 500)
		}
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
		
		if (userToken != null) {
			currentState = 'authed';
			document.getElementById('auth').innerHTML = "unauthorize";
			document.getElementById('auth').classList.remove("bling");
			document.getElementById('auth').classList.add("plain");
		}
	}

	function toggleAuth() {
		if (userToken == null) {
			openAuthWindow()
		} else {
			musicKitUnauth()
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

	function setupMusicKit() {
	    MusicKit.configure({
	      developerToken: developerToken,
	      app: {
	        name: 'Add to Library',
	        build: '0.1'
	      }
	    });
	}

	function musicKitUnauth() {
		music = MusicKit.getInstance()
		music.unauthorize().then(function (userToken) {
			chrome.cookies.getAll({domain: "https://add-to-library.appspot.com"}, function(cookies) {
			    for(var i=0; i<cookies.length;i++) {
			        chrome.cookies.remove({url: "https://add-to-library.appspot.com/", name: cookies[i].name});
			    }
			});
			unauth();
		}, function(result) {
			console.log("Unauth fail: " + result);
		});
	}

	function unauth() {
		currentState = 'unauthed';
		document.getElementById('auth').innerHTML = "authorize";
		document.getElementById('auth').classList.remove("plain");
		document.getElementById('auth').classList.add("bling");
	}

	function auth() {
		currentState = 'authed';
		document.getElementById('auth').innerHTML = "unauthorize";
		document.getElementById('auth').classList.remove("bling");
		document.getElementById('auth').classList.add("plain");

		getCookieDetails(developerTokenCookieDetails, (token) => {
			developerToken = token;
			setupMusicKit();
		});
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
};