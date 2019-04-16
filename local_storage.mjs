import { YouTubeTrackKeys } from "./youtube_track.mjs";

export class Storage {
    static sync() {
        Storage.get(Storage.videoIdsKey, (result) => {
            if (result == undefined) {
                Storage.set(Storage.videoIdsKey, Storage.videoIds)
            } else {
                Storage.videoIds = result;
                for (var i in result) {
                    var videoId = result[i];
                    Storage.getMetaData(videoId, (result) => {
                        if (result == null) {
                            console.log('Error finding meta-data for key: ' + videoId);
                            // remove key
                        }
                    });
                    Storage.getTrack(videoId, result => {
                        if (result == null) {
                            console.log('Error finding song info for key: ' + videoId);
                            // remove key
                        }
                    })
                }
            }
        });
    }

    static appendVideoID(videoId) {
        var valAtIndex = Storage.videoIds.indexOf(videoId);
        if (valAtIndex > -1) {
            Storage.videoIds.splice(valAtIndex, 1);
        }
        Storage.videoIds.push(videoId)
        Storage.set(Storage.videoIdsKey, Storage.videoIds);
    }

    static storeMetaData(videoId, title) {
        Storage.set(videoId, { title: title });
    }

    static getMetaData(key, callback=()=>{}) {
        if (Storage.metaData.hasOwnProperty(key)) {
            callback(Storage.tracks[key])
        } else {
            Storage.get(key, (data) => {
                if (data != null) {
                    Storage.metaData[key] = data;
                }
                callback(data);
            });
        }
    }

    static storeTrack(key, data) {
        key = `track-${key}`;
        Storage.tracks[key] = data;
        Storage.set(key, data);
    }

    static updateTrackInLibrary(key, songId, data) {
        key = `track-${key}`;
        for (var i in Storage.tracks[key][YouTubeTrackKeys.searchList]) {
            if (Storage.tracks[key][YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.songId] == songId) {
                Storage.tracks[key][YouTubeTrackKeys.searchList][i][YouTubeTrackKeys.inLibrary] = data;
                Storage.set(key, Storage.tracks[key]);
            }
        }    
    }

    static getTrack(key, callback=function(){}) {
        key = `track-${key}`;
        if (Storage.tracks.hasOwnProperty(key)) {
            callback(Storage.tracks[key])
        } else {
            Storage.get(key, (data) => {
                if (data !== null) {
                    Storage.tracks[key] = data;
                }
                callback(data);
            });
        }
    }

    static set(key, value, callback=function(){}) {
        chrome.storage.local.set({[key]: value}, function() {
            console.log("Stored key: " + key + " with value: ");
            console.log(value);
            callback();
        });
    }

    static get(key, callback) {
        chrome.storage.local.get([key], function(result) {
            console.log('Retreve value: ');
            console.log(result);
            if (result.hasOwnProperty(key)) {
                callback(result[key]);
            } else {
                callback(null);
            }
        });
    }
}

Storage.videoIdsKey = 'videoIds';
Storage.videoIds = [];
Storage.metaData = {};
Storage.tracks = {};
