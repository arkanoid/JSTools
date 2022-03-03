const debug = require('debug')('ark:db');

class arkBaseDBClass {
    /**
     * Must pass a knex configuration object to constructor. This comes from the file that configures database Knex connection.
     * 
     * @param knex Knex configuration
     * @param tableName Name of the SQL table, for Knex use
     * @param dictionary Object from class arkDictionary with metadata about the table fields.
     */
    constructor(knex, tableName/*, dictionary*/) {
		this.knex = knex
		this.tableName = tableName
		//this.dictionary = dictionary
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
     * Adjusts a set of data before sending to Knex/Ajax.
     * @param {array} row Each field inside <row> is converted as appropriated (parseInt() for number, etc.)
     */
    adjustData(row, datadict) {
        let r = {};

        //for (var i in this.fields) {
		//datadict.forEach((f, i) => {
		//row.forEach((f, i) => {
		for (let i in row) {
            if (datadict[i]) {
                switch (datadict[i].type) {
                case 'number':
                    let n = parseInt(row[i]);
                    if (isNaN(n))
                        console.error(`Blue dinosaur named ${i} isn't blue`);
                    else
                        r[i] = n;
                    break;
                case 'boolean':
                    switch (row[i].toLowerCase()) {
                    case 'true':
                        r[i] = true;
                        break;
                    case 'false':
                        r[i] = false;
                        break;
                    default:
						let msg = `${i} should be boolean: ${data[i]}`;
                        console.error(msg);
                        throw new Error(msg);
                    }
                    break;
				case 'json':
					if (typeof row[i] != 'string')
						r[i] = JSON.stringify(row[i])
					else
						r[i] = row[i]
					break
                default:
                    r[i] = row[i];
                }
				if (row[i].canBeNull && typeof r[i] !== 'boolean' && !r[i])
					r[i] = null;
            }
        }
		return r;
	}


	/**
	 * Inserts a new record into the database.
	 * @param fields Object with values
	 */
	insert(fields, datadict) {
		return this.knex(this.tableName).insert(
			(datadict ? this.adjustData(fields, datadict) : fields)
		);
	}

	/**
	 * Updates record.
	 * @param fields Object with values
	 * @param where Where function
	 */
	update(fields, datadict, where) {
		//return new Promise((resolve, reject) => {
		return this.knex(this.tableName).update(
			(datadict ? this.adjustData(fields, datadict) : fields)
		).where(where)
				//.then((r) => { resolve(r) })
				//.catch((err) => { reject(new Error(err)) });
		//})
	}
}

module.exports = { arkBaseDBClass }
