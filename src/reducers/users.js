import update from 'immutability-helper';

const initialState = {
    all: []
};

export default function(state = initialState, action) {

    switch(action.type) {

        case 'GET_USERS':

            var users = {};

            action.payload.forEach(function(item, i) {
                users[item.id] = item;
            });

            return Object.assign({}, state, {
                all: users
            });

        case 'ADD_USER':

            var NewUser = action.payload,
                UserId = action.payload.id;

            return update(
                state, {
                    all: {
                        [UserId]: { $set: NewUser }
                    }
                }
            )

        default:
            return state;
            
    }

}
