import steem from 'steem';

export function vote(request) {

	return new Promise((resolve, reject) => {

		console.log("request", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}
		
		steem.broadcast.vote(
	    	request.postingWif,
	    	request.username,
	    	request.author, 
	    	request.permalink,
	    	request.weight,
	    	(err, result) => {
	      		console.log(err, result);

	      		if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'VOTE_SUCCESS',
	        		payload: result
	        	});

	    	}
	  	);
	  	
    	
	});

}

export function comment(request) {

	return new Promise((resolve, reject) => {

		console.log("request for comment", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		// wif, parentAuthor, parentPermlink, author, permlink, title, body, jsonMetadata
		
		var permlink = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, '').toLowerCase();

		steem.broadcast.comment(
	    	request.postingWif,
	    	request.author,
	    	request.permalink, 
	    	request.username,
	    	permlink,
	    	'', // title
	    	request.comment,
	    	'', // Json Metadata
	    	(err, result) => {
	      		console.log(err, result);

	      		if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'COMMENT_SUCCESS',
	        		payload: result
	        	});

	    	}
	  	);
	  	
    	
	});

}

export function post(request) {

	return new Promise((resolve, reject) => {

		console.log("request for new post", request)

		if(!request.postingWif) {

			reject({
	    		payload: 'Something went wrong. Most likely not logged in.'
	    	});

  			return;
		}

		steem.broadcast.comment(
			request.postingWif, 
            '', 
            request.category, // category
            request.username, 
            request.slug, // slug
            request.title, // title
            request.body, // body 
            {
                tags: request.tags,
                vit_data: request.vit_data
            }, 
            (err, result) => {
                
                if(err) {

	      			reject({
			    		payload: err
			    	});

	      			return;
	      			
	      		}

	      		resolve({
	        		type: 'POST_SUCCESS',
	        		payload: result
	        	});

            }
        );

	      	
	});

}
