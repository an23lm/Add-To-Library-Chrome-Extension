export class YouTubeTrack { 
    static createNewTrack (videoId, title) {
        obj = {
            [YouTubeTrackKeys.title]: title,
            [YouTubeTrackKeys.originalTitle]: title,
            [YouTubeTrackKeys.videoId]: videoId,
            [YouTubeTrackKeys.searchList]: []
        };
    
        return obj;
    }
    
    static createTrackFromResponse (videoId, term, youtubeTitle, response) {
        var results = response['results'];
        var obj = {};
        if (Object.keys(results).length === 0) {
            console.log("No items found");
            obj = {
                [YouTubeTrackKeys.title]: term,
                [YouTubeTrackKeys.originalTitle]: youtubeTitle,
                [YouTubeTrackKeys.videoId]: videoId,
                [YouTubeTrackKeys.searchList]: []
            };
        } else {
            var songs = results['songs']['data'];
            var songList = [];
            for (var i = 0; i < songs.length; i++) {
                var song = songs[i];
    
                var newSong = {};
                newSong[YouTubeTrackKeys.albumName] = song['attributes']['albumName'];
                newSong[YouTubeTrackKeys.artistName] = song['attributes']['artistName'];
                newSong[YouTubeTrackKeys.songName] = song['attributes']['name'];
                newSong[YouTubeTrackKeys.songArtwork] = {
                    [YouTubeTrackKeys.songArtworkBgColor]: song['attributes']['artwork']['bgColor'],
                    [YouTubeTrackKeys.songArtworkUrl]: song['attributes']['artwork']['url']
                };
                newSong[YouTubeTrackKeys.songUrl] = song['attributes']['url'];
                newSong[YouTubeTrackKeys.songHref] = song['href'];
                newSong[YouTubeTrackKeys.songId] = song['id'];
                newSong[YouTubeTrackKeys.inLibrary] = false;
    
                songList.push(newSong);
            }
            obj = {
                [YouTubeTrackKeys.title]: term,
                [YouTubeTrackKeys.originalTitle]: youtubeTitle,
                [YouTubeTrackKeys.videoId]: videoId,
                [YouTubeTrackKeys.searchList]: songList
            };
        }
        return obj;
    }
}

export class YouTubeTrackKeys { }

YouTubeTrackKeys.title = 'title';
YouTubeTrackKeys.originalTitle = 'original_title';
YouTubeTrackKeys.videoId = 'video_id';
YouTubeTrackKeys.searchList = 'search_list';
YouTubeTrackKeys.albumName = 'album_name';
YouTubeTrackKeys.artistName = 'artist_name';
YouTubeTrackKeys.songName = 'song_name';
YouTubeTrackKeys.songArtwork = 'song_artwork';
YouTubeTrackKeys.songArtworkBgColor = 'song_artwork_bg_color'
YouTubeTrackKeys.songArtworkUrl = 'song_artwork_url'
YouTubeTrackKeys.songUrl = 'song_url';
YouTubeTrackKeys.songHref = 'song_href';
YouTubeTrackKeys.songId = 'song_id';
YouTubeTrackKeys.inLibrary = 'is_added';
