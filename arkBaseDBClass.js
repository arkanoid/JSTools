class arkBaseDBClass {
    /**
     * Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
     * 
     * @param knex Knex configuration
     * @param tableName Name of the SQL table, for Knex use
     * @param dictionary Object from class arkDictionary with metadata about the table fields.
     */
    constructor(knex, tableName, dictionary) {
		this.knex = knex
		this.tableName = tableName
		this.dictionary = dictionary
    }
	
    /**
     * Returns first record to match fields
     * @param where Used in WHERE clause.
	 * @param (optional) fields Array of which fields to return (will return '*' if not specified).
     */
    findFirst(where, fields) {
		return new Promise((resolve, reject) => {
			this.knex.first(fields || '*').from(this.tableName)
				.where(where)
				.then((row) => { resolve(row) })
				.catch((err) => { reject(new Error(err)) })
		})
    }

	/**
	 * Inserts a new record into the database.
	 * @param fields Object with values
	 * @param [optional] If true, uses arkDictionary filter() on data.
	 */
	insert(fields, filter) {
		return new Promise((resolve, reject) => {
			this.knex(this.tableName).insert(filter ? this.dictionary.filter(fields) : fields)
				.then((r) => { resolve(r) })
				.catch((err) => { reject(new Error(err)) });
		})
	}
}

module.exports = { arkBaseDBClass }


// garbage to sort out below

/**
 * Finds a user based on the provided credentials. If the user doesn't exist, create it.
 */
exports.findOrCreate = function(authid, username, email, authType, authToken) {
    return new Promise((resolve, reject) => {
        knex.first('id', 'name', 'hints')
	    .from('users').where('auth_id', authid)
	    .then(function(row) {
	        if (row) {
		    return private.knexAdmin("users").update({ last_auth: "now()"}).where("auth_id", authid)
		        .then(function(u) { resolve(row); })
		        .catch(function(err) { reject(new Error(err)); });
	        } else { // new user
		    let data = {
		        name: username.substr(0, 32),
		        name_change: true,
		        email: email,
		        auth_type: authType,
		        auth_id: authid,
		        auth_token: authToken,
		        last_auth: "now()"
		    };
                    debug(`User findOrCreate: creating user ${username}`);
		    //console.log(data);
		    //console.log('criei foi nada');
		    private.knexAdmin("users").insert(data, "id")
		        .then((r) => {
			    return newUserData(r[0]);
                        })
			.then((n) => {
			    resolve(n);
			})
			.catch(function(err) {
			    reject(new Error(err));
		            });
		    //resolve(444);
		    //return data;
	        }
	    })
	    .catch(function(err) {
	        reject(new Error(err));
	    });
    });
}
