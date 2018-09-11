import steem from 'steem';
import axios from 'axios'
import { DMCA_CONTENT_ENDPOINT, DMCA_USER_ENDPOINT } from './../config'
import { sign } from 'steem/lib/auth/ecc/src/signature';

export function loginUser(request) {   

    return new Promise((resolve, reject) => {

    	steem.api.getAccounts([request.username], (err, accounts) => {

    		if(err) {

    			reject({
	        		type: 'INVALID_ACCOUNT',
	        		payload: ["Account doesn't exist"]
	        	})

	            return false;
    		}
			
	        if(accounts.length === 0) {

	        	reject({
	        		type: 'INVALID_ACCOUNT',
	        		payload: ["Account doesn't exist"]
	        	})

	            return false;
	        }

	        let posting_key = accounts[0]['posting'].key_auths[0][0],
	            wif = steem.auth.toWif(request.username, request.password, ['posting']),
	            publicWif = steem.auth.wifToPublic(wif),
	            postingWif = wif;

	        if(posting_key === publicWif) {
				// generate the signature used for upload Video and Image
				const { signature, signUserHost } = generateUserSignature(request.username, postingWif);

	            resolve({
	        		type: 'LOGIN_USER',
	        		payload: {
	        			'username': request.username,
	        			'publicWif': publicWif,
						'postingWif': postingWif,
						'signature': signature,
						'signUserHost': signUserHost
	        		}
	        	})

	        } else {

	            reject({
	        		type: 'INVALID_PASSWORD',
	        		payload: ["Account doesn't exist"]
	        	})

	        }
	        

	    });
    	
	});

}

// generate the signature used for upload Video and Image
function generateUserSignature(username, postingWif) {
	const hostName = window.location.hostname;
	const signUserHost = [username, hostName].join('@');
	const signature = sign(signUserHost, postingWif);

	return { signature: signature.toHex(), signUserHost: signUserHost};
}

export function restoreLogin(request) {

    return {
        type: 'LOGIN_USER',
        payload: request
    };

}

export function logout(request) {

	localStorage.removeItem('username');
	localStorage.removeItem('publicWif');
	localStorage.removeItem('signature');
	localStorage.removeItem('signUserHost');

    return {
        type: 'LOGOUT',
        payload: []
    };

}

export function subscribe(request) {

	return new Promise((resolve, reject) => {

		console.log("subscribe request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		var json = JSON.stringify(
		    ['follow', {
		      	follower: request.username,
		      	following: request.following,
		      	what: ['blog']
		    }]
		);

		steem.broadcast.customJson(
		    request.postingWif,
		    [],
		    [request.username],
		    'follow',
		    json,
		    (err, result) => {
		      	console.log(err, result);

		      	if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'FOLLOW_SUCCESS',
	        		payload: result
	        	});

		    }
		);
    	
	});

}

export function unsubscribe(request) {

	return new Promise((resolve, reject) => {

		console.log("unsubscribe request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		var json = JSON.stringify(
		    ['follow', {
		      	follower: request.username,
		      	following: request.following,
		      	what: []
		    }]
		);

		steem.broadcast.customJson(
		    request.postingWif,
		    [],
		    [request.username],
		    'follow',
		    json,
		    (err, result) => {
		      	console.log(err, result);

		      	if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'UNFOLLOW_SUCCESS',
	        		payload: result
	        	});

		    }
		);
    	
	});

}


export function getSubs(request) {   

    return new Promise((resolve, reject) => {

    	steem.api.getFollowing(request.username, 0, 'blog', 100, (err, result) => {


    		if(err) {
    			reject({
			    	payload: err
		    	});

      			return;
    		}

            resolve({
        		type: 'GET_SUBS',
        		payload: result
        	});

        });


    	
	});

}

export function getDMCAContents() {
	return new Promise((resolve, reject) => {
		fetchData(DMCA_CONTENT_ENDPOINT)
			.then(response => {
				resolve({
					type: 'SET_DMCA_CONTENTS',
					payload: response
				});
			})
			.catch(error => {
				resolve({
					type: 'SET_DMCA_CONTENTS',
					payload: []
				});
			});
	});
};

export function getBlockedUsers() {
	return new Promise((resolve, reject) => {
		fetchData(DMCA_USER_ENDPOINT)
			.then(response => {
				resolve({
					type: 'SET_BLOCKED_USERS',
					payload: response
				});
			})
			.catch(error => {
				resolve({
					type: 'SET_BLOCKED_USERS',
					payload: []
				});
			});
	});
};

function fetchData(endpoint) {
	return new Promise((resolve, reject) => {
		axios.get(endpoint)
		.then(response => {
			resolve(response.data.split("\n"));
		})
		.catch(error => {
			reject(error);
			console.log(error);
		});
	})        
}  

