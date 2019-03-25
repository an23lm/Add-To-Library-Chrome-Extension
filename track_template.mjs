class Track {
	
	constructor(found=false, data, key, expandable=true) {
		if (found && expandable) {
			this.track = this.getFoundExpandTemplate(data['name'], data['artistName'], key);
		} else if (found && !expandable) {
			this.track = this.getFoundTemplate(data['name'], data['artistName'], key);
		} else {
			this.track = this.getNotFoundTemplate(data, key);
		}
		return this;
	}

	getHTML() {
		return this.track;
	}

	getFoundExpandTemplate(title, artist, key) {
		return `
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
	                <div class="add-button">
	                    <img src="./resources/plus.svg">
	                </div>
	            </div>
	        </div>`;
	}

	getFoundTemplate(title, artist, key) {
		return `
			<div class="track track-found" data-key="${key}">
	            <div class="track-art">
	                <div class="art"></div>
	            </div>
	            <div class="track-details">
	                <div class="track-title">${title}</div>
	                <div class="track-artist">${artist}</div>
	            </div>
	            <div class="track-add">
	                <div class="add-button">
	                    <img src="./resources/plus.svg">
	                </div>
	            </div>
	        </div>`;
	}

	getNotFoundTemplate(track, key) {
		return `
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
            </div>`;
	}
} 