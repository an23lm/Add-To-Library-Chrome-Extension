import { YouTubeTrackKeys } from './youtube_track.mjs';

export class Track {
	constructor(found=false, data, key, expandable=true) {
		this.found = found;
		this.data = data;
		this.key = key;
		this.expandable = expandable;

		this.createTrack();
		return this;
	}

	createTrack() {
		if (this.found && this.expandable) {
			this.track = this.getFoundExpandTemplate(this.data[YouTubeTrackKeys.songName], this.data[YouTubeTrackKeys.artistName], this.data[YouTubeTrackKeys.songId], this.data[YouTubeTrackKeys.inLibrary], this.key);
		} else if (this.found && !this.expandable) {
			this.track = this.getFoundTemplate(this.data[YouTubeTrackKeys.songName], this.data[YouTubeTrackKeys.artistName], this.data[YouTubeTrackKeys.songId], this.data[YouTubeTrackKeys.inLibrary], this.key);
		} else {
			this.track = this.getNotFoundTemplate(this.data, this.key);
		}
	}

	getHTML() {
		return this.track;
	}

	reload(found, data) {
		this.found = found;
		this.data = data;
		this.createTrack();
	}

	getFoundExpandTemplate(title, artist, songid, isadded, key) {
		return `
		<div id="${key}">
			<div class="track track-found" data-key="${key}">
	            <div class="track-art">
	                <div class="art"></div>
	            </div>
	            <div class="track-details">
	                <div class="track-title">${title}</div>
	                <div class="track-artist">${artist}</div>
	                <div class="expand-text">click to see more</div>
	                <div class="expand-bar"></div>
	            </div>
	            <div class="track-add">
	                <div class="add-button" data-key="${key}" data-song-id="${songid}">
	                    <img src="./resources/${ isadded ? 'success.svg' : 'plus.svg' }">
	                </div>
	            </div>
			</div>
		</div>`;
	}

	getFoundTemplate(title, artist, songid, isadded, key) {
		return `
		<div id="${key}">
			<div class="track track-found" data-key="${key}">
	            <div class="track-art">
	                <div class="art"></div>
	            </div>
	            <div class="track-details">
	                <div class="track-title">${title}</div>
	                <div class="track-artist">${artist}</div>
	            </div>
	            <div class="track-add">
	                <div class="add-button" data-key="${key}" data-song-id="${songid}">
	                    <img src="./resources/${ isadded ? 'success.svg' : 'plus.svg' }">
	                </div>
	            </div>
			</div>
		</div>`;
	}

	getNotFoundTemplate(track, key) {
		return `
		<div id="${key}">
		    <div class="track track-not-found" data-key="${key}">
                <div class="track-art">
                    <div class="art">
                        <img src="./resources/youtube.svg" />
                    </div>
                </div>
                <div class="track-details">
                    <div class="track-name">${track}</div>
                    <div class="expand-text">click to search</div>
	                <div class="expand-bar"></div>
                </div>
                <div class="track-add">
                    <div class="search-button">
                        <img src="./resources/search.svg">
                    </div>
                </div>
			</div>
		</div>`;
	}
} 