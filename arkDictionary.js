/*
 * Changelog
 * 2022-01-30
 * - Added type 'json'
 * 2022-02-03
 * - Added field 'realFieldName'
 * - selections, knexData
 */

const arkDictionaryClient = require('./arkDictionaryClient')

class arkDictionary extends arkDictionaryClient {
	// stores the data received when created
	#tableName

	// Map of selections, values are another Map with fields from that selection
	#selections;
	
	// Map of parameters for knex.js SELECT and respective JOINs
	#knexData = new Map();
	
    constructor(fields, table) {
		super(fields)
		if (!table)
			throw new Error('arkDictionary received no table name')
		this.#tableName = table

		this.#selections = new Map()
		this.newSelectionKnexData('*')

		this.fields.forEach((v, k) => {

			let dbcolumn = (v.realFieldName || k)

			this.#knexData.get('*').get('select').push(dbcolumn)
			
			// Separate and register selections
			if (v.selections)
				v.selections.forEach((s) => {
					//if (!this.#selectionNames.includes(s)) {
					if (!this.#selections.has(s)) {
						//this.#selectionNames.push(s)
						this.#selections.set(s, new Map())
						this.newSelectionKnexData(s)
					}
					this.#selections.get(s).set(dbcolumn, v)
				})

			// Create list for knex (fields for SELECT and lists for JOINs)
			if (v.references && v.references.foreignData && !v.references.nested) {
				// adds data for each selection
				let knexDataJoin = [
					v.references.table,
					 `${this.#tableName}.${dbcolumn}`,
					'=',
					`${v.references.table}.${v.references.field}`
				]
				this.#knexData.get('*').get('joins').push(knexDataJoin)
				if (v.selections)
					v.selections.forEach((s) => {
						this.#knexData.get(s).get('joins').push(knexDataJoin)
					})
				v.references.foreignData.forEach((ref) => {
					this.#knexData.get('*').get('select').push(`${v.references.table}.${ref} AS ${v.references.table}_${ref}`)
					if (v.selections)
						v.selections.forEach((s) => {
							this.#knexData.get(s).get('select').push(`${v.references.table}.${ref} AS ${v.references.table}_${ref}`)
						})
				})
			} else if (v.references && v.references.foreignData && v.references.nested) {
				// nested
				this.#knexData.get('*').get('maps').push({
					table: v.references.table, // knex(...)
					foreignData: v.references.foreignData, // select(...,...)
					referenceField: `${v.references.table}.${v.references.field}`, // where(...,
					referenceFromMainQuery: dbcolumn, // ...)
					key: k
				});
				if (v.selections)
					v.selections.forEach((s) => {
						this.#knexData.get(s).get('maps').push({
							table: v.references.table, // knex(...)
							foreignData: v.references.foreignData, // select(...,...)
							referenceField: `${v.references.table}.${v.references.field}`, // where(...,
							referenceFromMainQuery: dbcolumn, // ...)
							key: k
						});
					})
			} else {
				// no references
				if (v.selections)
					v.selections.forEach((s) => {
						this.#knexData.get(s).get('select').push(`${this.#tableName}.${dbcolumn}`)
					})
			}
		})
	}				

	/* Add new selection name to structure #knexData
	 * Inside each selectionName:
	 * - select: structure to mount the SELECT query for that selection.
	 * - joins: arrays to mount the JOIN clauses
	 * - maps: arrays to mount the map() functions for subqueries
	 */
	newSelectionKnexData(selectionName) {
		this.#knexData.set(selectionName, new Map())
		this.#knexData.get(selectionName).set('select', [])
		this.#knexData.get(selectionName).set('joins', [])
		this.#knexData.get(selectionName).set('maps', [])
	}

	/**
	 * Returns data for use in knex functions inside an array:
	 * @return [ select, joins ]
	 * @param selection (optional) Selection name. If not specified '*' will be used.
	 * The returned value "joins" is an array like this:
	 * [ [ 'tablename', 'tablename.anothertable_id', '=', 'anothertable.id' ] ]
	 * So each element of the array can be used for a knex .join() call.
	 */
	getKnexData(selection = '*') {
		return [
			this.#knexData.get(selection).get('select'),
			this.#knexData.get(selection).get('joins'),
			this.#knexData.get(selection).get('maps')
		];
	}
	
	
    getFieldValue(field, value) {
        if (this.fields[field].keyOf)
            return this.fields[field].keyOf[value].name;
        else
            return value;
    }

	/**
	 * Filter given object, return only fields that exist in dictionary.
	 * Useful for pruning out extra data in input object before sending to database.
	 */
	filter(inputFields) {
		var r = {};

		for (var i in inputFields)
			if (this.fields[i])
				r[i] = inputFields[i];

		return r;
	}
	
    /**
     * Filters dictionaries based on criteria.
     * @param {object} criteria Which dict fields should have which values. e.g.: { showEdit: true }
     * @return dict fields copied
     */
    filterWithCriteria(criteria) {
	var r = {};
	
	for (var i in this.fields) {
	    var criteriaMet = true;
	    for (var j in criteria)
		switch (j) {
		case "showEdit":
		case "showInCardList":
		    if (!(this.fields[i][j] === criteria[j]
			  || (criteria[j] && typeof this.fields[i][j] === "undefined")))
			criteriaMet = false;
		    break;
		case "canBeNull":
                case "primaryKey":
		    if (!(this.fields[i][j] === criteria[j]
			  || (!criteria[j] && typeof this.fields[i][j] === "undefined"))) {
			criteriaMet = false;
			break;
		    }
		    break;
		}
	    if (criteriaMet)
		r[i] = this.fields[i];
	}
	
	return r;
    }


    /**
     * Scans all form fields in the page with ids #prefix + field-name and return their values.
     * @return Data passed through adjustData().
     */
    getDataFromForm(formPrefix) {
        let r = {};

        for (var i in this.fields) {
            let e = $(`#${formPrefix}${i}`);
            if (e[0]) {
                switch (e.attr("type")) {
                case 'checkbox':
                    r[i] = e.prop("checked");
                    break;
                default:
                    r[i] = e.val();
                }
                // converts data type
                /*switch (d[i].type) {
                  case 'number':
                  var n = parseInt(r[i]);
                  if (isNaN(n)) {
                  throw r[i] + " isn't a number";
                  }
                  r[i] = n;
                  break;
                  }*/
            }
        }
        return this.adjustData(r);
    }

    /**
     * @param data {Object} A single row, as received by Ajax
     * @param prefix: Applied to field names to find form objects. e.g.: if prefix = "en_" then we expect to find <input id="en_name">
     */
    populateForm(data, prefix) {
	      for (var i in this.fields) {
		        var e = $(`#${prefix}${i}`);
		        if (e[0]) {
		            switch(e[0].tagName) {
			          case 'INPUT':
				            if (e.attr("type") == "checkbox") {
					              e.prop("checked", data[i]);
				            } else
					              e.val(data[i]);
				            break;
			          case 'SELECT':
				            e.val(data[i]);
				            break;
			          default:
                    alert('Error populating form');
				            console.log('populateForm(): unrecognized HTML tag ' + e[0].tagName);
		            };
		        } // If (e)
		        //alert("switch end");
	      }
    }

}


/*
    exports = Dictionary;
})(typeof exports === 'undefined' ? this['dict'] = {} : exports);
*/

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = arkDictionary;
}
