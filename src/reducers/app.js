
const initialState = {
    "username": null,
    "publicWif": null,
    "authorized": false,
    "subs": [],
    dmcaContents: null,
    blockedUsers: null,
    seletedTags: []
};

export default function(state = initialState, action) {

    switch(action.type) {

        case 'LOGIN_USER':

            return Object.assign({}, state, {
                "username": action.payload.username,
                "publicWif": action.payload.publicWif,
                "postingWif": action.payload.postingWif,
                "authorized": true
            });

        case 'LOGOUT':

            return Object.assign({}, state, {
            	"username": null,
                "publicWif": null,
                "authorized": false
            });

        case 'UPDATE_USER':

            let UpdatedObject = action.payload,
                UserObject = Object.assign({}, state.user); // clone user object to work with

            for (var property in UpdatedObject) {
                UserObject[property] = UpdatedObject[property]; // update the keys from UpdatedObject only
            }

            return Object.assign({}, state, {
                user: UserObject
            });

        case 'GET_SUBS':
        
            return Object.assign({}, state, {
                subs: action.payload
            });

        case 'SET_DMCA_CONTENTS': {
            return Object.assign({}, state, {
                dmcaContents: action.payload
            });
        }

        case 'SET_BLOCKED_USERS': {
            return Object.assign({}, state, {
                blockedUsers: action.payload
            });
        }

        case 'CLAIM_REWARDS': {
            console.log(action.payload)
        }

        case 'UPDATE_SELECTED_TAGS':
            let tempTags = [...state.seletedTags];
            const foundElement = tempTags.find(e => {
                return e === action.payload
            });

            if (!foundElement) {
                // add 
                tempTags.push(action.payload);
            } else {
                // remove
                const index = tempTags.indexOf(foundElement);
                tempTags.splice(index, 1);
            }

            return {
                ...state,
                seletedTags: tempTags
            }

        default:
            return state;
    }

}