export const shouldDisplayPost = (state, post, loadedPosts=[]) => {
    let displayPost = false;

    try {
        var jsonMetadata = JSON.parse(post.json_metadata)
        
        var postHashes = loadedPosts.map((post) => {return JSON.parse(post.json_metadata).vit_data.Hash})
        if (jsonMetadata.vit_data.type === undefined && postHashes.includes(jsonMetadata.vit_data.Hash)) { console.log('duplicate post found');return displayPost }

        if ((jsonMetadata.tags && jsonMetadata.tags.includes('touch-tube')) &&
                ((jsonMetadata.vit_data.Hash && jsonMetadata.vit_data.Playlist) || (jsonMetadata.vit_data.type && jsonMetadata.vit_data.type === 'external')) &&
                !state.blockedUsers.includes(post.author) &&
                !state.dmcaContents.includes(`@${post.author}/${post.permlink}`)) {
            displayPost = true
        }
    } catch(e) {
        // do something?; likely not a related post anyway
    }

    return displayPost
}

export const processTags = (tags, type_filter) => {
    return tags.filter(t => {
        // FILTER Rules
        if(['touch-tube', 'touchit-social'].includes(t.name)) {
            return false;
        }
        return true;
    }).map(t => {
        // Tag rewrite rules
        let [k,v] = t.name.split(/:(.*)/); // Nifty side-effect of regex matching, only splits once on :
        if(!v) {
            t.tag = t.name;
            t.name = k;
            t.type = 'user';
        } else {
            t.tag = t.name;
            t.name = v;
            t.type = k;
        }
        return t;
    }).filter( t => {
        if(!type_filter) {
            return true;
        }
        if(t.type === type_filter) {
            return true;
        }
        return false;
    });
}

export const processSimpleTags = (tags, type_filter) => {
    // TODO(svitx/2018-10-02):
    //   Convert to 'full' tags using state data, or at least restructure them
    //   to be of the form { name: value }
    return tags.filter( t => {
        // FILTER Rules
        if(['touch-tube', 'touchit-social'].includes(t)) {
            return false;
        }
        return true;
    }).map( t=> {
        // Tag rewrite rules
        let [k,v] = t.split(/:(.*)/); // Nifty side-effect of regex matching, only splits once on :
        if(!v) {
            return {
                tag: t,
                name: k,
                type: 'user',
            }
        } else {
            return {
                tag: t,
                type: k,
                name: v,
            }
        }
    }).filter( t => {
        if(!type_filter) {
            return true;
        }
        if(t.type === type_filter) {
            return true;
        }
        return false;
    });
}
