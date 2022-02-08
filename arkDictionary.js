/*
 * Changelog
 * 2022-01-30
 * - Added type 'json'
 * 2022-02-03
 * - Added field 'realFieldName'
 * - selections, knexData
 */
/**
 * Database "dictionaries" to ease some work I have with Knex.js.
 * A dictionary here is a list of the table fields and some descriptive data.
 * General structure:
 * const fields = {
 *   db_field_name: {...},
 * }
 * Each field data contains the following:
 * - label: string describing the field
 * - type: string, number, boolean, json
 * - realFieldName: optional, if defined will be used instead of db_field_name. Useful for defining the same field more than once for different references (foreign table joins).
 * - showEdit (optional, default true): this field should be used in a <form>
 * - showInCardList (optional, default true): should appear in a <ul> list inside a <card>.
 * - canBeNull (optional, default false): if true, blank values will be substituted with null before updating/inserting.
 * - primaryKey (optional, default false): Defines if this field is a primary key. Most tables will have only one field but some can have more than one.
 * - selections (optional): Array with names of selections.
 *	Selections are field groupings for different queries. For example, let's say a table has the fields: id, name, description, class_id
 * (where this last one references another table.)
 * Fields id and name have selections: ['short','long']. Field class_id has selections: ['long'].
 * In the relevant methods, if 'short' is passed as selection name, only the fields [id, name] will be used.
 * If 'long' is the selection name only the fields [id, name, class_id] will be used.
 *
 * - references (optional): Field references another table. Example tructure:
 *	{	field: 'id',		// field name in foreign table
 *		table: 'tableb',	// foreign table
 *		foreignData: ['name', 'abc']	// fields from foreign table
 * }
 * In the structure above, foreign table fields will be added to queries using the table name and _ as alias. Ex: "tableb.name AS tableb_name"
 *
 * - keyOf (optional): Defines an object from where to take the 'real' data from. Useful for ENUM db fields.
 *  The object will have a structure like this:
 *  exampleEnum = {
 *    "enumField": {
 *      "name": "The Enum Field" // more presentable than "enumField"
 *      // ... there may be other fields, for customized use
 *    }
 *  }
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

		//this.#selectionNames = []
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
			if (v.references && v.references.foreignData) {
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
			} else {
				// no references
				if (v.selections)
					v.selections.forEach((s) => {
						this.#knexData.get(s).get('select').push(`${this.#tableName}.${dbcolumn}`)
					})
			}
		})
	}				

	// Add new selection name to structure #knexData
	newSelectionKnexData(selectionName) {
		this.#knexData.set(selectionName, new Map())
		this.#knexData.get(selectionName).set('select', [])
		this.#knexData.get(selectionName).set('joins', [])
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
		return [ this.#knexData.get(selection).get('select'), this.#knexData.get(selection).get('joins') ]
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
