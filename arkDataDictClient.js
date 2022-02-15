// This class is meant both as the base class to arkDataDict (which is server side), and also meant to be used client side.
var arkDataDictList = new Map();

class arkDataDictClient {
	fields;
	primaryKeyFields;

	constructor(fields, tableName) {
        if (!fields)
            throw new Error('arkDataDictClient created with no fields');
		if (arkDataDictList.get(tableName))
			return;
		
        this.fields = fields;

		// adjust some options
		this.fields.forEach((v, k) => {
			// default label
			if (!v.hasOwnProperty('label'))
				v.label = k.charAt(0).toUpperCase() + k.slice(1);
			
			// adjust display options
			let display;
			if (!v.hasOwnProperty('display'))
				display = {};
			else if (typeof v.display == 'boolean') {
				if (v.display)
					display = {};
				else
					display = false;
			} else
				display = v.display;
			if (typeof v.display != 'boolean') {
				if (!display.position)
					display.position = 'shared';
				if (!display.label)
					display.label = 'b';
				if (!display.notShowIn)
					display.notShowIn = [];
			}
			v.display = display;
		});

		arkDataDictList.set(tableName, this);
	}

	/**
     * Adjusts a set of data before sending to Knex/Ajax.
     * @param {array} data Each field inside <data> is converted as appropriated (parseInt() for number, etc.)
     */
    adjustData(data) {
        let r = {};

        //for (var i in this.fields) {
		this.fields.forEach((f, i) => {
            if (data[i]) {
                switch (f.type) {
                case 'number':
                    let n = parseInt(data[i]);
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
						let msg = `${i} should be boolean: ${data[i]}`
                        console.error(msg)
                        throw new Error(msg)
                    }
                    break;
				case 'json':
					if (typeof data[i] != 'string')
						r[i] = JSON.stringify(data[i])
					else
						r[i] = data[i]
					break
                default:
                    r[i] = data[i];
                }
				if (f.canBeNull && typeof r[i] !== 'boolean' && !r[i])
					r[i] = null;
            }
        })
		return r;
	}

	/*
	 * Takes a record of data (usually taken from database - one record only)
	 * and formats it according to the 'show' options in the data dictionary.
	 */
	toString(data, elementType, style) {
		let result = '';

		for (let i in data) {
			let dictEntry = this.fields.get(i);
			//let display = this.fields.get(i).display;

			// display is false
			if (typeof dictEntry.display == 'boolean' && !dictEntry.display)
				continue;
			
			if (!dictEntry.display.notShowIn.includes(style)) {
				let label = dictEntry.label;
				let value = data[i];

				// field references a nested table
				if (dictEntry.references && dictEntry.references.nested) {
					// first let's find the correct dict
					let dict = arkDataDictList.get(dictEntry.references.table);
					if (!dict)
						value = `[datadict ${dictEntry.references.table} not found]`;
					else {
						value = '';
						data[i].forEach((subData) => {
							value += dict.toString(subData, elementType, style);
						});
					}
				}
				
				switch (elementType) {
				case 'DIV':
					if (dictEntry.display.position == 'single')
						result += '<br>';
					if (dictEntry.display.label == 'b')
						result += `<b>${label}</b>: ${value} `;
					else {
						// formatting string
						let v = dictEntry.display.label;
						v = v.replace(/{label}/g, label);
						v = v.replace(/{value}/g, value);
						result += v;
					}
					if (dictEntry.display.position == 'single')
						result += '<br>';
					break;
				case 'UL':
				case 'OL':
					break;
				case 'TABLE':
					break;
				}

			}
		}

		return result;
	}
	
	/**
	 * Returns a string with all primary key fields united. Note: param is a RECORD only
	 * Example: suppose the primary keys in the dictionary are the fields 'user_id' and 'product_id'.
	 * Suppose data is: { user_id: 14, product_id: 71, other: 'xyz' }
	 * Result is: '14-71'
	 */
	generateStringId(data) {
		// create a list of the primary key fields, if it's not done yet
		if (!this.primaryKeyFields) {
			this.primaryKeyFields = new Array();
			this.fields.forEach((v, k) => {
				if (v.primaryKey)
					this.primaryKeyFields.push(k);
			});
		}

		return this.primaryKeyFields.filter((v) => { return data.hasOwnProperty(v); }).reduce((total, v) => { return total + (total.length > 0 ? '-' : '') + data[v]; }, '');
	}
}

/*if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = arkDictionaryClient;
	}*/

try {
	if (this === window) {
		// browser
	}
} catch(e) {
	module.exports = arkDataDictClient;
}
