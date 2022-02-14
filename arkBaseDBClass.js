const debug = require('debug')('ark:db');

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
	 * Returns a SELECT statement automatically creating JOINs on fields which have "references" property in dictionary.
	 * NOTE: You don't need necessarily to pass the 'where' parameter. You can get the result of this method and apply a .where()
	 * method directly to it.
	 */
	select(selection, where=null) {
		// fields holds all fields in the SELECT, including from other tables, if any.
		// joins holds a list of parameters for knex .join() function.
		let [ fields, joins, maps ] = this.dictionary.getKnexData(selection)

		debug('arkBaseDBClass select()', selection, fields, joins, maps);

		// if any JOIN was defined, adds it
		let result = this.knex(this.tableName).select(fields);
		//let resultMaps = [];
		if (joins.length)
			joins.forEach((j) => {
				result = result.join(...j)
			});

		if (where)
			result = result.where(where);
		
		if (maps && maps.length)
			maps.forEach((m) => {
				//debug('select() maps loop');
				//debug(m);
				result = result.map(
				//-resultMaps.push(
					function(row) {
					return this.knex(m.table).select(m.foreignData)
						.where(m.referenceField, `${this.tableName}.${m.referenceFromMainQuery}`)
						.then((mapdata) => {
							row[m.key] = mapdata;
							return row;
						})
						//.catch((err) => { console.log(`arkBaseDBClass select(${selection}) map`, err); });
					}
				//-);
				);
			});

		/*if (resultMaps && maps)
			return [ result, resultMaps ];
		else*/
			return result;
	}

	// under testing. if works, will substitute select()
	selectX(selection, where=null) {
		return new Promise((resolve, reject) => {
			// fields holds all fields in the SELECT, including from other tables, if any.
			// joins holds a list of parameters for knex .join() function.
			let [ fields, joins, maps ] = this.dictionary.getKnexData(selection)
			debug('arkBaseDBClass select()', selection, fields, joins, maps);

			// if any JOIN was defined, adds it
			let result = this.knex(this.tableName).select(fields);

			if (joins.length)
				joins.forEach((j) => {
					result = result.join(...j)
				});

			if (where)
				result = result.where(where);

			// runs the query
			// 2 different ways, if we have map or not
			if (maps && maps.length) {

				result.then((rows) => {
					let promiseList = [];
					rows.forEach((row) => {
						maps.forEach((m) => {
							promiseList.push(new Promise((rs, rj) => {
								let q = this.knex(m.table).select(m.foreignData)
									.where(m.referenceField, row[m.referenceFromMainQuery]); //`${this.tableName}.${m.referenceFromMainQuery}`);
								debug(q.toSQL());
								q.then((mapdata) => {
									row[m.key] = mapdata;
									rs();
								})
									.catch((err) => { rj(err); });
							}));
						});
					});
					Promise.all(promiseList).then((r) => {
						resolve(rows);
					})
						.catch((err) => { reject(err); });
				});

			} else {
				// no maps.
				result.then((rows) => {
					resolve(rows);
				})
					.catch((err) => { reject(err); });
			}
		});
	}


	/*
	 * Does the same as select(), but with no joins, no maps, just a plain select. 
	 * Ignores fields with 'references' property.
	 */
	selectNoJoinReferences(selection) {
		let [ fields ] = this.dictionary.getKnexData(selection)
		return this.knex(this.tableName).select(fields)
	}

	/**
	 * Inserts a new record into the database.
	 * @param fields Object with values
	 * @param [optional] If true, uses arkDictionary filter() on data.
	 */
	insert(fields, filter) {
		//return new Promise((resolve, reject) => {
			return this.knex(this.tableName).insert(filter ? this.dictionary.filter(fields) : fields)
			//	.then((r) => { resolve(r) })
			//	.catch((err) => { reject(new Error(err)) });
		//})
	}

	/**
	 * Updates record.
	 * @param fields Object with values
	 * @param where Where function
	 */
	update(fields, where) {
		//return new Promise((resolve, reject) => {
			return this.knex(this.tableName).update(fields).where(where)
				//.then((r) => { resolve(r) })
				//.catch((err) => { reject(new Error(err)) });
		//})
	}

	
	/*jsonRemove(field, jsonPath) {
		return this.knex(this.tableName).jsonRemove(field, jsonPath)
	}*/
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
