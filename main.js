/**
 * Author: Anselm Joseph
 * GitHub: github.com/an23lm
 * Email: anselmjosephs@gmail.com
*/

import { Track } from './track_template.mjs';
import { YouTubeTrackKeys } from './youtube_track.mjs';

/// Init on DOM load
var videoIds = [];
var metadata = {};
var tracks = {};
var trackInstances = {};
var selectorTrackInstances = {};
var openSelectorKey = null;

document.addEventListener("DOMContentLoaded", function(){ init(); }, false);

/**
 * Init the popup when clicked on the extension icon
 */
function init() {
	/// Register Event Listeners
    document.getElementById("go-to-options").addEventListener("click", openOptions);
    document.getElementById("options-button").addEventListener("click", openOptions);
    document.getElementById("selector-close").addEventListener("click", closeTrackSelector)
    document.getElementById("selector-search").addEventListener("click", searchTrackInSelector)

    /// Event Handlers
    function openOptions() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    }

    function closeTrackSelector() {
        if (tracks[`track-${openSelectorKey}`][YouTubeTrackKeys.searchList].length > 0) {
            var index = getIndexOfAddedTrackFromList(tracks[`track-${openSelectorKey}`][YouTubeTrackKeys.searchList]);
            trackInstances[openSelectorKey].reload(true, tracks[`track-${openSelectorKey}`][YouTubeTrackKeys.searchList][index]);
            var domEle = document.getElementById(openSelectorKey);
            domEle.outerHTML = trackInstances[openSelectorKey].getHTML();

            var url = tracks[`track-${openSelectorKey}`][YouTubeTrackKeys.searchList][0][YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
            url = url.replace("{w}", "100");
            url = url.replace("{h}", "100");
            document.getElementById(openSelectorKey).getElementsByClassName('art-img')[0].setAttribute('src', url);
        } else {
            trackInstances[openSelectorKey].reload(false, tracks[`track-${openSelectorKey}`][YouTubeTrackKeys.title]);
            var domEle = document.getElementById(openSelectorKey);
            domEle.outerHTML = trackInstances[openSelectorKey].getHTML();
        }

        registerButtonsOnTracks();

        openSelectorKey = null;
    	document.getElementById('selector-overlay').classList.remove('active');
    	document.getElementById('selector-overlay').classList.add('inactive');
    	setTimeout(() => {
            document.getElementById('selector-overlay').style.display = "none";
            document.getElementById('selector-result-list').innerHTML = '';
            selectorTrackInstances = {};
        }, 300);
    	document.getElementById('scroll-wrapper').classList.remove('blur');
    }

    listenForRefresh();
    getAllData();
}

function getAllData() {
    chrome.runtime.sendMessage({type: "get", key: "all"}, function(response) {
        if (response.err === undefined) {
            videoIds = response.ids;
            metadata = response.metadata;
            tracks = response.tracks;
            createTracks();
        } else {
            if (response.err === 1) {
                document.getElementById('welcome-overlay').classList.remove('inactive');
    	        document.getElementById('welcome-overlay').classList.add('active');
            }
        }
      }
    );
}

function listenForRefresh() {
    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (sender.id === chrome.runtime.id && request.type === 'newmetadata') {
            } else  if (sender.id === chrome.runtime.id && request.type === 'newtrack') {
                getAllData();
            }
        }
    );
}

function createTracks() {
    var historyDom = document.getElementById('history');
    for (var i in videoIds) {
        var trackKey = `track-${videoIds[i]}`;
        if (tracks[trackKey] !== undefined) {
            trackInstances[videoIds[i]] = createHistoryTrack(videoIds[i], tracks[trackKey]);
            historyDom.insertAdjacentHTML('afterbegin', trackInstances[videoIds[i]].getHTML());
            if (tracks[trackKey][YouTubeTrackKeys.searchList].length > 0) {
                var url = tracks[trackKey][YouTubeTrackKeys.searchList][0][YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
                url = url.replace("{w}", "100");
                url = url.replace("{h}", "100");
                document.getElementById(videoIds[i]).getElementsByClassName('art-img')[0].setAttribute('src', url);
            }
        } else {
            // newTrackDOMElements.push(createMetaTrack(videoIds[i], metadata[videoIds[i]]))
        }
    }
    registerButtonsOnTracks();
}

function getIndexOfAddedTrackFromList(tracks) {
    for (var i in tracks) {
        if (tracks[i][YouTubeTrackKeys.inLibrary]) {
            return i;
        }
    }
    return 0;
}

/**
 * Create track object and insert to popup
 * @param {String} key
 * @param {Object} trackObj 
 */
function createHistoryTrack(key, trackObj) {
    var track = null;
    if (trackObj[YouTubeTrackKeys.searchList].length > 0) {
        var index = getIndexOfAddedTrackFromList(trackObj[YouTubeTrackKeys.searchList]);
        track = new Track(true, trackObj[YouTubeTrackKeys.searchList][index], key);
    } else {
        track = new Track(false, trackObj[YouTubeTrackKeys.title], key);
    }
    return track;
}

function createMetaTrack(key, trackObj) {
    // var track = null;
    // if (trackObj[YouTubeTrackKeys.searchList].length > 0) {
    //     track = new Track(true, trackObj[YouTubeTrackKeys.searchList][0], key);
    // } else {
    //     track = new Track(false, trackObj[YouTubeTrackKeys.title], key);
    // }
    // return track;
}

function registerButtonsOnTracks() {
    var tracksEles = document.getElementsByClassName('track');
    for (var i = 0; i < tracksEles.length; i++) {
        tracksEles[i].addEventListener('click', openTrackSelector);
        var addButton = tracksEles[i].getElementsByClassName('add-button');
        if (addButton.length > 0) { 
            addButton[0].addEventListener('click', addSongButtonListener);
        }
    }
}

function addSongButtonListener(event) {
    var key = this.getAttribute('data-key');
    var songid = this.getAttribute('data-song-id');
    event.currentTarget.classList.add("highlight");
    addSong(key, songid);
    event.stopPropagation();
}

function addSong(key, songid) {
    chrome.runtime.sendMessage({type: "add", key: "song", value: songid, videoId: key}, function(response) {
        if (response === true) {
            var trackdata = tracks[`track-${key}`];
            if (trackdata[YouTubeTrackKeys.searchList].length > 0) {
                for (var i = 0; i < trackdata[YouTubeTrackKeys.searchList].length; i++) {
                    if (trackdata[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.songId] == songid) {
                        trackdata[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.inLibrary] = true;
                        trackInstances[key].reload(true, trackdata[YouTubeTrackKeys.searchList][i]);
                        break;
                    }
                }
            }
            var domEle = document.getElementById(key);
            domEle.outerHTML = trackInstances[key].getHTML();

            var url = trackInstances[key].data[YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
            url = url.replace("{w}", "100");
            url = url.replace("{h}", "100");
            domEle = document.getElementById(key);
            domEle.getElementsByClassName('art-img')[0].setAttribute('src', url);
            // handle add
        } else {
            var domEle = document.getElementById(key);
            domEle.outerHTML = trackInstances[key].getHTML();
            
            var url = trackInstances[key].data[YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
            url = url.replace("{w}", "100");
            url = url.replace("{h}", "100");
            domEle = document.getElementById(key);
            domEle.getElementsByClassName('art-img')[0].setAttribute('src', url);
            // handle failed
        }
        registerButtonsOnTracks();
      }
    );
}

/**
 * Open the track selector UI for the selected track
 * @param {Track} track 
 */
function openTrackSelector() {
    var key = this.getAttribute('data-key');
    openSelectorKey = key;
    var thisTrackObj = tracks[`track-${key}`];
    
    document.getElementById('selector-overlay').setAttribute("data-key", key);
    document.querySelector('#selector-youtube-title').innerHTML = thisTrackObj[YouTubeTrackKeys.originalTitle];
    document.querySelector('#selector-track-title input').value = thisTrackObj[YouTubeTrackKeys.title];
    loadSelectorTracks(thisTrackObj, key);

    /* Animate in the selector overlay */
    document.getElementById('selector-overlay').style.display = "block";
    document.getElementById('selector-overlay').classList.remove('inactive');
    document.getElementById('selector-overlay').classList.add('active');
    document.getElementById('scroll-wrapper').classList.add('blur');
}

function registerButtonsOnSelectors() {
    var selector = document.getElementById('selector-overlay');
    var tracksEles = selector.getElementsByClassName('track');
    for (var i = 0; i < tracksEles.length; i++) {
        var addButton = tracksEles[i].getElementsByClassName('add-button');
        if (addButton.length > 0) { 
            addButton[0].addEventListener('click', addSelectorSongButtonListener);
        }
    }
}

function addSelectorSongButtonListener(event) {
    var key = this.getAttribute('data-key');
    var songid = this.getAttribute('data-song-id');
    event.currentTarget.classList.add("highlight");
    addSelectorSong(key, songid);
    event.stopPropagation();
}

function addSelectorSong(key, songid) {
    chrome.runtime.sendMessage({type: "add", key: "song", value: songid, videoId: key}, function(response) {
        if (response === true) {
            var trackdata = tracks[`track-${key}`];
            if (trackdata[YouTubeTrackKeys.searchList].length > 0) {
                for (var i = 0; i < trackdata[YouTubeTrackKeys.searchList].length; i++) {
                    if (trackdata[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.songId] == songid) {
                        trackdata[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.inLibrary] = true;
                        selectorTrackInstances[songid].reload(true, trackdata[YouTubeTrackKeys.searchList][i]);
                        break;
                    }
                }
            }
            var domEle = document.getElementById(`s-${songid}`);
            domEle.outerHTML = selectorTrackInstances[songid].getHTML();
            
            var url = selectorTrackInstances[songid].data[YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
            url = url.replace("{w}", "100");
            url = url.replace("{h}", "100");
            domEle = document.getElementById(`s-${songid}`);
            domEle.getElementsByClassName('art-img')[0].setAttribute('src', url);
        } else {
            var domEle = document.getElementById(`s-${songid}`);
            domEle.outerHTML = selectorTrackInstances[songid].getHTML();
            
            var url = selectorTrackInstances[songid].data[YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
            url = url.replace("{w}", "100");
            url = url.replace("{h}", "100");
            domEle = document.getElementById(`s-${songid}`);
            domEle.getElementsByClassName('art-img')[0].setAttribute('src', url);
        }
        registerButtonsOnSelectors();
      }
    );
}

/**
 * Search for track in overlay UI
**/
function searchTrackInSelector() {
    var searchTerm = document.querySelector('#selector-track-title input').value;
    var key = document.getElementById('selector-overlay').getAttribute('data-key');
    var youtubeTitle = tracks[`track-${key}`][YouTubeTrackKeys.originalTitle];
    debugger;
    chrome.runtime.sendMessage({type: "search", videoId: key, title: searchTerm, originalTitle: youtubeTitle},
        (response) => {
            if (response.err != null) {
                return;
            }
            tracks[`track-${key}`] = response.track;
            document.getElementById('selector-result-list').innerHTML = '';
            selectorTrackInstances = {};
            loadSelectorTracks(response.track, key);
        }
    );
}

/**
 * Get Track HTML
 * @param {Array} list
 * @param {string} key
 * @return {string} return html
**/
function loadSelectorTracks(list, key) {
    var selectorDom = document.getElementById('selector-result-list');
    for(var i = 0; i < list[YouTubeTrackKeys.searchList].length; i++) {
        var songid = list[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.songId];
        selectorTrackInstances[songid] = new Track(true, list[YouTubeTrackKeys.searchList][i], key, false)
        selectorDom.insertAdjacentHTML('beforeend', selectorTrackInstances[songid].getHTML());
        var url = list[YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.songArtwork][YouTubeTrackKeys.songArtworkUrl];
        url = url.replace("{w}", "100");
        url = url.replace("{h}", "100");
        document.getElementById(`s-${songid}`).getElementsByClassName('art-img')[0].setAttribute('src', url);
    }

    registerButtonsOnSelectors();
}