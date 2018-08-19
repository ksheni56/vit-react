import axios from 'axios'

class DMCAUtils {

    constructor () {
        this.dmca_content = []
        this.dmca_user = []  
    }

    isBlockedContent (url) {
        return this.dmca_content.includes(url);
    }

    isBlockedUser (username) {
        return this.dmca_user.includes(username);
    }

    isBlocked(url, username) {
        return this.dmca_content.includes(url) || this.dmca_user.includes(username);
    }

    fetch (dmca_content_endpoint, dmca_user_endpoint) {
        this.dmca_content_endpoint = dmca_content_endpoint
        this.dmca_user_endpoint = dmca_user_endpoint

        this._fetchData(dmca_content_endpoint)
            .then(data => {
                this.dmca_content = data
            });
        this._fetchData(dmca_user_endpoint)
            .then(data => {
                this.dmca_user = data
            });
    }

    _fetchData(endpoint) {
        return new Promise((resolve, reject) => {
            axios.get(endpoint)
            .then(response => {
                resolve(response.data.split("\n"));
            })
            .catch(error => {
                console.log(error);
                reject(error);
            });
        })        
    }    
}

export default new DMCAUtils();