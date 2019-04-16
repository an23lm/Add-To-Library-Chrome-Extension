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
    	document.getElementById('selector-overlay').classList.remove('active');
    	document.getElementById('selector-overlay').classList.add('inactive');
    	setTimeout(function(){ document.getElementById('selector-overlay').style.display = "none"; }, 300);
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
            console.log(metadata);
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
                console.log('new meta data');
            } else  if (sender.id === chrome.runtime.id && request.type === 'newtrack') {
                console.log('new track')
            }
        }
    );
}

function createTracks() {
    var historyDom = document.getElementById('history');
    for (var i in videoIds) {
        var trackKey = `track-${videoIds[i]}`;
        if (tracks[trackKey] !== undefined) {
            trackInstances[videoIds[i]] = createTrack(videoIds[i], tracks[trackKey]);
            historyDom.insertAdjacentHTML('afterbegin', trackInstances[videoIds[i]].getHTML());
        } else {
            console.log('meta track ' + videoIds[i]);
            console.log(metadata)
            // newTrackDOMElements.push(createMetaTrack(videoIds[i], metadata[videoIds[i]]))
        }
    }
    registerButtonsOnTracks();
}

/**
 * Create track object and insert to popup
 * @param {String} key
 * @param {Object} trackObj 
 */
function createTrack(key, trackObj) {
    var track = null;
    if (trackObj[YouTubeTrackKeys.searchList].length > 0) {
        track = new Track(true, trackObj[YouTubeTrackKeys.searchList][0], key);
    } else {
        track = new Track(false, trackObj[YouTubeTrackKeys.title], key);
    }
    return track;
}

function createMetaTrack(key, trackObj) {
    console.log(key)
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
    addSong(key, songid);
    event.stopPropagation();
}

function addSong(key, songid) {
    chrome.runtime.sendMessage({type: "add", key: "song", value: songid, videoId: key}, function(response) {
        if (response === true) {
            console.log('added song');
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
            // handle add
        } else {
            console.log('failed to add');
            // handle failed
        }
      }
    );
}

/**
 * Open the track selector UI for the selected track
 * @param {Track} track 
 */
function openTrackSelector() {
    var key = this.getAttribute('data-key');
    var thisTrackObj = tracks[`track-${key}`];
    
    var thisTracksHtml = getTracksHTML(thisTrackObj, key);

    document.getElementById('selector-overlay').setAttribute("data-key", key);
    document.querySelector('#selector-youtube-title').innerHTML = thisTrackObj[YouTubeTrackKeys.originalTitle];
    document.querySelector('#selector-track-title input').value = thisTrackObj[YouTubeTrackKeys.title];
    document.getElementById('selector-result-list').innerHTML = thisTracksHtml;

    /* Animate in the selector overlay */
    document.getElementById('selector-overlay').style.display = "block";
    document.getElementById('selector-overlay').classList.remove('inactive');
    document.getElementById('selector-overlay').classList.add('active');
    document.getElementById('scroll-wrapper').classList.add('blur');
}

/**
 * Search for track in overlay UI
**/
function searchTrackInSelector() {
    var searchTerm = document.querySelector('#selector-track-title input').value;
    var key = document.getElementById('selector-overlay').getAttribute('data-key');
    var youtubeTitle = tracks[`track-${key}`][YouTubeTrackKeys.originalTitle];
    
    chrome.extension.getBackgroundPage().searchAPIs(searchTerm, youtubeTitle, key, (videoId, object, err) => {
        if (err != null) {
            console.log(err);
            return;
        }
        var thisTracksHtml = getTracksHTML(object, key);
        document.getElementById('selector-result-list').innerHTML = thisTracksHtml;
    });
}

/**
 * Get Track HTML
 * @param {Array} list
 * @param {string} key
 * @return {string} return html
**/
function getTracksHTML(list, key) {
    var thisTracksHtml = "";

    for(var i = 0; i < list[YouTubeTrackKeys.searchList].length; i++) {
        var newT = new Track(true, list[YouTubeTrackKeys.searchList][i], key, false)
        thisTracksHtml += newT.getHTML();
    }
    return thisTracksHtml;
}
