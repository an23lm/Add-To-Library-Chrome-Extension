/**
 * Author: Anselm Joseph
 * GitHub: github.com/an23lm
 * Email: anselmjosephs@gmail.com
*/

import { Storage } from "./local_storage.mjs";
import { AppleAPI } from "./apple_api.mjs"
import { YouTubeTrack, YouTubeTrackKeys } from "./youtube_track.mjs"

const devTokenDeets = {
	'url': 'https://add-to-library.appspot.com/',
	'name': 'developertoken'
};
const musicTokenDeets = {
	'url': 'https://add-to-library.appspot.com/',
	'name': 'applemusicuser'
};
const storefrontDeets = {
	'url': 'https://add-to-library.appspot.com/',
	'name': 'applestorefront'
};

var DEV_TOKEN = null;
var USER_TOKEN = null;
var STOREFRONT = null;
var api = null;
var auth = false;

Storage.sync()

loadAllTokens()

function loadAllTokens() {
	var devTokenPromise = getCookieValue(devTokenDeets)
	var musicTokenPromise = getCookieValue(musicTokenDeets)
	var storefrontPromise = getCookieValue(storefrontDeets)

	Promise.all([devTokenPromise, musicTokenPromise, storefrontPromise])
		.then(values => {
			DEV_TOKEN = values[0]
			USER_TOKEN = values[1]
			STOREFRONT = values[2]
			tokensLoaded(true)
		})
		.catch(err => {
			console.log(err);
			console.log('Tokens not found')
			tokensLoaded(false)
		});
}

function tokensLoaded(flag) {
	if (flag) {
		auth = true;
		api = new AppleAPI(DEV_TOKEN, USER_TOKEN, STOREFRONT);
		initTabListener();
	} else {
		// ask user to reauth
		auth = false;
		removeCookie(musicTokenDeets);
		removeCookie(storefrontDeets);
		removeCookie(devTokenDeets);
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (sender.id === chrome.runtime.id && request.type === 'authchange') {
			console.log('loading tokens');
			loadAllTokens();
			sendResponse('ACK');
		} else if (sender.id === chrome.runtime.id && auth == true) {
			if (request.type === 'get') {
				if (request.key === 'ids') {
					sendResponse({ids: Storage.videoIds});
				} else if (request.key === 'track') {
					sendResponse({tracks: Storage.tracks[request.value]});
				} else if (request.key === 'all') {
					sendResponse({ids: Storage.videoIds, metadata: Storage.metadata, tracks: Storage.tracks});
				}
			} else if (request.type === 'set') {
				if (request.key == 'track') {
					Storage.storeTrack(request.trackKey, request.trackValue);
				}
			} else if (request.type === 'add') {
				if (request.key == 'song') {
					var id = request.value;
					var key = request.videoId;

					api.addSongToLibrary(id)
						.then( res => {
							Storage.updateTrackInLibrary(key, id, true);
							sendResponse(res);
						 } )
						.catch( err => sendResponse(false, err) );
					
					return true;
				}
			} else if (request.type === 'search') {
				var videoId = request.videoId;
				var title = request.title;
				var originalTitle = request.originalTitle;

				api.search(title)
					.then((response) => {
						var obj = YouTubeTrack.createTrackFromResponse(videoId, title, originalTitle, response);
						Storage.storeTrack(videoId, obj);
						sendResponse({track: obj, err: null});
					}).catch(err => {
						// handle error
						console.log('Search on Apple Music API failed')
						console.log(err);
						sendResponse({track: null, err: err});
					});
				return true;
			}
		} else if (sender.id === chrome.runtime.id && auth == false) {
			sendResponse({err: 1});
		}
	}
);

function sendMessageToPopup(type, key, value) {
	chrome.runtime.sendMessage({type: type, key: key, value: value});
}

function initTabListener() {
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
		if (changeInfo.title != undefined) {
			if (tab.url.startsWith("https://www.youtube.com/watch") && tab.title.endsWith(" - YouTube")) {
				var title = tab.title.split(" - YouTube")[0];
				var videoId = tab.url.split('v=')[1];
				var ampersandPosition = videoId.indexOf('&');
				if(ampersandPosition != -1) {
				  videoId = videoId.substring(0, ampersandPosition);
				}

				isVideoCategoryMusic(videoId).then(res => {
					if (!res) {
						return;
					}

					Storage.appendVideoID(videoId);
					Storage.storeMetaData(videoId, title);
					sendMessageToPopup('newmetadata', videoId, title);

					api.search(title)
						.then((response) => {
							var obj = YouTubeTrack.createTrackFromResponse(videoId, title, title, response);
							Storage.storeTrack(videoId, obj);
							sendMessageToPopup('newtrack', videoId, obj);
						}).catch(err => {
							// handle error
							console.log('Search on Apple Music API failed')
							console.log(err);
						});
				})		
			}
		}
	});
}

async function getCookieValue(details) {
	return new Promise(function(resolve, reject) {
		chrome.cookies.get(details, function(cookie) {
			var token = null;
			if (cookie != null) {
				token = cookie.value.trim() != "" ? cookie.value : null;
			}
			if (token == null) {
				reject(token);
			} else {
				resolve(token);
			}
		});
	});
}

async function removeCookie(details) {
	return new Promise(function(resolve, reject) {
		chrome.cookies.remove(details, (details) => {
			if (details == null) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

async function isVideoCategoryMusic(videoId) {
	const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=<api key>`;
	const params = {
		method: "GET",
		mode: "cors"
	};
	return new Promise((resolve, reject) => {
		fetch(url, params).then(response => {
			if (!response.ok) {
				console.log(response);
				reject(response);
				return
			}
			return response.json();
		}).then(data => {
			console.log(data);
			if (data["items"][0]["snippet"]["categoryId"] == 10) {
				resolve(true);
			} else {
				resolve(false);
			}
		}).catch(error => {
			console.log(error);
			reject(error);
		})
	})
}
