/**
 * Author: Anselm Joseph
 * GitHub: github.com/an23lm
 * Email: anselmjosephs@gmail.com
*/

/// Init on DOM load
document.addEventListener("DOMContentLoaded", function(){ init(); }, false);
var tracks = {};
var trackObjs = [];

/**
 * Init the popup when clicked on the extension icon
 */
function init() {
	/// Register Event Listeners
    document.getElementById("go-to-options").addEventListener("click", openOptions);
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

    loadTracksFromStorage();
}

/**
 * Load the tracks from local storage
 */
function loadTracksFromStorage() {
    retrieve('videoIds', function(_key, result) {
        var i = result['ids'].length - 1;
        while (i >= 0) {
            retrieve(result['ids'][i--], createTrack);
        }
    })
}

/**
 * Create track object and insert to popup
 * @param {String} key
 * @param {Object} trackObj 
 */
function createTrack(key, trackObj) {
    tracks[key] = trackObj;

    if (trackObj['list'].length > 0) {
        trackObjs.push(new Track(true, trackObj['list'][0], key));
    } else {
        trackObjs.push(new Track(false, trackObj['title'], key));
    }
    
    loadTracks();
}

function loadTracks() {
    var trackListHTML = '';
    for (var i = 0; i < trackObjs.length; i++) {
        trackListHTML += trackObjs[i].getHTML();
    }
    document.getElementById('history').innerHTML = trackListHTML;

    var tracksEles = document.getElementsByClassName('track');
    var i = tracksEles.length;
    while (i--) 
        tracksEles[i].addEventListener('click', openTrackSelector);
}

/**
 * Open the track selector UI for the selected track
 * @param {Track} track 
 */
function openTrackSelector() {
    var key = this.getAttribute('data-key');
    var thisTrackObj = tracks[key];
    
    var thisTracksHtml = getTracksHTML(thisTrackObj, key);

    document.getElementById('selector-overlay').setAttribute("data-key", key);
    document.querySelector('#selector-youtube-title').innerHTML = thisTrackObj['youtubeTitle'];
    document.querySelector('#selector-track-title input').value = thisTrackObj['title'];
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
    var youtubeTitle = tracks[key]['youtubeTitle'];
    
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

    for(var i = 0; i < list['list'].length; i++) {
        var newT = new Track(true, list['list'][i], key, false)
        thisTracksHtml += newT.getHTML();
    }
    return thisTracksHtml;
}

/**
 * Store the key/value pair into local storage and callback when completed
 * @param {string} key 
 * @param {*} value 
 * @param {function} callback 
 */
function store(key, value, callback=function(){}) {
    chrome.storage.local.set({[key]: value}, function() {
        console.log("Stored key: " + key + " with value: ");
        console.log(value);
        callback();
    });
}

/**
 * Retrieve key from local storage and callback when completed
 * @param {string} key 
 * @param {function} callback 
 */
function retrieve(key, callback) {
    chrome.storage.local.get([key], function(result) {
        console.log('retreve value: ');
        console.log(result);
        callback(key, result[key]);
    })
}
