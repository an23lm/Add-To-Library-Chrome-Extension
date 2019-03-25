var videoIds = {'ids': []};
store('videoIds', videoIds, function() {console.log('set')});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.title != undefined) {
        if (tab.url.startsWith("https://www.youtube.com/watch") && tab.title.endsWith(" - YouTube")) {
            var title = tab.title.split(" - YouTube")[0];
            var videoId = tab.url.split('v=')[1];
			var ampersandPosition = videoId.indexOf('&');
			if(ampersandPosition != -1) {
			  videoId = videoId.substring(0, ampersandPosition);
			}
			retrieve('videoIds', function(result) {
				if (Object.keys(result).length == 0) {
					result = videoIds;
				}
				if (result['ids'].indexOf(videoId) > -1) {
					result['ids'].splice(result['ids'].indexOf(videoId), 1);
				}
				result['ids'].push(videoId);
				store('videoIds', result);
			});
            searchAPIs(title, title, videoId);
        }
    }
});

const musicTokenDeets = {
	'url': 'https://add-to-library.appspot.com/',
	'name': 'applemusicuser'
};

const storefrontDeets = {
	'url': 'https://add-to-library.appspot.com/',
	'name': 'applestorefront'
};

async function searchAPIs(term, youtubeTitle, videoId, callback=()=>{}) {
	const url = 'https://add-to-library.appspot.com/search';
	let formData = new FormData();
	formData.append('term', term);
	formData.append('videoId', videoId);

	try {
		const musicToken = await getCookieToken(musicTokenDeets);
		const storefront = await getCookieToken(storefrontDeets);

		const oParam = {
			headers: {
				"Music-User-Token": musicToken,
				"Apple-Storefront": storefront,
			},
			body: formData,
			method: "POST"
		};

		fetch(url, oParam).then(response => {
			return response.json();
		}).then(data => {
			if (data['SUCCESS'] == "true") {
				var results = data['response']['results'];
				if (Object.keys(results).length === 0) {
					console.log("No items found");
					var obj = {'title': term, 'youtubeTitle': youtubeTitle, 'list': []}
					store(videoId, obj);
					callback(videoId, obj, null);
				} else {
					var songs = results['songs']['data'];
					var songList = [];
					for (var i = 0; i < songs.length; i++) {
						var song = songs[i];

						var newSong = {};
						newSong['albumName'] = song['attributes']['albumName'];
						newSong['artistName'] = song['attributes']['artistName'];
						newSong['name'] = song['attributes']['name'];
						newSong['artwork'] = {'bgColor': song['attributes']['artwork']['bgColor'], 'url': song['attributes']['artwork']['url']};
						newSong['url'] = song['attributes']['url'];
						newSong['href'] = song['href'];
						newSong['id'] = song['id'];
						newSong['type'] = song['type'];

						songList.push(newSong);
					}
					var songObj = {'title': term, 'youtubeTitle': youtubeTitle, 'list': songList}
					store(videoId, songObj);
					callback(videoId, songObj, null);
				}
			} else {
				console.log("Search Failed");
				callback(null, null, "Search Failed");
			}
		}).then(err => {
			if (err != undefined) {
				console.log(err);
				callback(null, null, "Search Failed");
			}
		})
	} catch(error) {
		console.log(error);
		callback(undefined, undefined, "Search Failed");
	}
}

async function getCookieToken(details) {
	return new Promise(function(resolve, reject) {
		chrome.cookies.get(details, function(cookie) {
			var token = null;
			if (cookie != null) {
				token = cookie.value.trim() != "" ? cookie.value : null;
			}
			if (token == null) {
				reject("Token is null");
			} else {
				resolve(token);
			}
		});
	});
}

function store(key, value, callback=function(){}) {
	chrome.storage.local.set({[key]: value}, function() {
		console.log("Stored key: " + key + " with value: ");
		console.log(value);
		callback();
	});
}

function retrieve(key, callback) {
	chrome.storage.local.get([key], function(result) {
		console.log('retreve value: ');
		console.log(result);
		callback(result[key]);
	})
}
