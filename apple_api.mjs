export class AppleAPI {
    constructor(devToken, userToken, storefront) {
        this.url = 'https://api.music.apple.com/v1/';
        this.devToken = devToken;
        this.userToken = userToken;
        this.storefront = storefront;
        this.limit = 10;
        this.types = 'songs'
    }

    handleError(error) {
        console.log(error);
        console.log(this.devToken);
        console.log(this.userToken);
        console.log(this.storefront);
    }

    async search(term) {
        const searchUrl = new URL(this.url + `catalog/${this.storefront}/search`);

        let searchParams = {term: term, limit: this.limit, types: this.types};
        searchUrl.search = new URLSearchParams(searchParams);

        const params = {
			headers: {
				"Authorization": `Bearer ${this.devToken}`,
				"Music-User-Token": this.userToken,
			},
			method: "GET"
        };
        
        return new Promise((resolve, reject) => {
            fetch(searchUrl, params).then(response => {
                if (!response.ok) {
                    this.handleError(response);
                    reject(response);
                }
                resolve(response.json());
            }).catch(error => {
                this.handleError(error);
                reject(error);
            });
        });
    }

    async doesLibraryHaveSong(songid) {
        const searchUrl = new URL(this.url + `me/library/songs/${songid}`);

        const params = {
            headers: {
                "Authorization": `Bearer ${this.devToken}`,
                "Music-User-Token": this.userToken
            },
            method: "GET"
        };

        return new Promise((resolve, reject) => {
            fetch(searchUrl, params).then(response => {
                if(!response.ok) {
                    this.handleError(response);
                    reject(response);
                    return;
                }
                return response.json();
            }).then(data => {
                if (data['data'].length > 0) {
                    resolve(true);
                    return;
                }
                resolve(false);
            }).catch(error => {
                this.handleError(error);
                reject(error);
            })
        })
    }

    async addSongToLibrary(songid) {
        const searchUrl = new URL(this.url + `me/library`);

        const body = new FormData();
        body.append('ids[songs]', [songid]);

        const params = {
			headers: {
				"Authorization": `Bearer ${this.devToken}`,
				"Music-User-Token": this.userToken,
            },
            body: body,
			method: "POST"
        };

        return new Promise((resolve, reject) => {
            fetch(searchUrl, params).then(response => {
                if (!response.ok || response.status != 202) {
                    this.handleError(response);
                    reject(response);
                    return;
                }
                resolve(true);
            }).catch(error => {
                this.handleError(error);
                reject(error);
            });
        });
    }
}