/**
 * Database "dictionaries" to ease some work I have with Knex.js.
 * A dictionary here is a list of the table fields and some descriptive data.
 * General structure:
 * const fields = {
 *   "db_field_name": {...},
 * }
 * Each field data contains the following:
 * label: string describing the field
 * type: string, number, boolean
 * showEdit (optional, default true): this field should be used in a <form>
 * showInCardList (optional, default true): should appear in a <ul> list inside a <card>.
 * canBeNull (optional, default false): if true, blank values will be substituted with null before updating/inserting.
 * primaryKey (optional, default false): Defines if this field is a primary key. Most tables will have only one field but some can have more than one.
 * keyOf (optional): Defines an object from where to take the 'real' data from. Useful for ENUM db fields.
 *  The object will have a structure like this:
 *  exampleEnum = {
 *    "enumField": {
 *      "name": "The Enum Field" // more presentable than "enumField"
 *      // ... there may be other fields, for customized use
 *    }
 *  }
 */

/*
(function(exports) {
*/

class Dictionary {
    constructor(fields) {
        if (!fields)
            throw new Error('arkDictionary with no fields created');
        this.fields = fields;
    }

    getFieldValue(field, value) {
        if (this.fields[field].keyOf)
            return this.fields[field].keyOf[value].name;
        else
            return value;
    }

    /**
     * Filters dictionaries based on criteria. Needs copy() defined in functions.js.
     * @param {object} criteria Which dict fields should have which values. e.g.: { showEdit: true }
     * @return dict fields copy()ed
     */
    filter(criteria) {
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
		r[i] = copy(this.fields[i]);
	}
	
	return r;
    }

    /**
     * Adjusts a set of data for sending to Knex/Ajax.
     * @param {array} data Each field inside <data> is converted as appropriated (parseInt() for number, etc.)
     */
    adjustData(data) {
        var r = {};

        for (var i in this.fields) {
            if (data[i]) {
                switch (this.fields[i].type) {
                case 'number':
                    var n = parseInt(data[i]);
                    if (isNaN(n))
                        console.error(`Blue dinosaur named ${i} isn't blue`);
                    else
                        r[i] = n;
                    break;
                case 'boolean':
                    switch (data[i].toLowerCase()) {
                    case 'true':
                        r[i] = true;
                        break;
                    case 'false':
                        r[i] = false;
                        break;
                    default:
                        console.error(i, "should be boolean:", data[i]);
                        throw i + " should be boolean: " + data[i];
                    }
                    break;
                default:
                    r[i] = data[i];
                }
								if (this.fields[i].canBeNull && typeof r[i] !== 'boolean' && !r[i])
										r[i] = null;
            }
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
    module.exports = Dictionary;
}
