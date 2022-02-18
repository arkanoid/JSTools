// This class is meant both as the base class to arkDataDict (which is server side), and also meant to be used client side.
var arkDataDictList = new Map();

class arkDataDictClient {
	fields;
	primaryKeyFields;

	constructor(fields, tableName) {
        if (!fields)
            throw new Error('arkDataDictClient created with no fields');
		if (arkDataDictList.get(tableName)) {
			let msg = 'Please, take this ' + tableName;
			try {
				if (this === window) { alert(msg); } }
			catch(err) { console.log(msg); }
			return;
		}
		
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


	fieldToString(fieldName, value, elementType, style) {
		let result = '';
		//console.log(fieldName, this.fields);
		let dictEntry = this.fields.get(fieldName);
		let label = dictEntry.label;

		try {
			//console.log(`fieldName: ${fieldName}, value: ${value}, label: ${label}, elementType: ${elementType}`, dictEntry);

			switch (elementType) {
			case 'DIV':
				if (dictEntry.display.position == 'single')
					result += '<br>';
				if (dictEntry.display.label == 'b')
					result += `<b>${label}</b>: ${value} `;
				else {
					// formatting string
					let v = dictEntry.display.label;
					//console.log('v was', v);
					v = v.replace(/{label}/g, label);
					v = v.replace(/{value}/g, value);
					result += v;
					//console.log('now v is', v);
				}
				if (dictEntry.display.position == 'single')
					result += '<br>';
				break;
			case 'UL':
			case 'OL':
				break;
			case 'TABLE':
				break;
			default:
				console.log(`wasn't expecting ${elementType}`);
			}
		} catch(e) {
			let msg = 'A yellow donkey thinks:' + e;
			if (typeof window === 'undefined')
				console.log(msg);
			else
				alert(msg);
		}

		//console.log('Is there a result?', result);
		return result;
	}
	
	/*
	 * Takes a record of data (usually taken from database - one record only)
	 * and formats it according to the 'show' options in the data dictionary.
	 */
	rowToString(data, elementType, style) {
		let result = '';

		try {
			for (let i in data) {
				let dictEntry = this.fields.get(i);
				let dict;

				if (!dictEntry) {
					// maybe it's a referenced field from another table?
					let [ ftable, ffield ] = i.split('__');
					if (ftable && ffield) {
						dict = arkDataDictList.get(ftable);
						if (!dict)
							console.log(`[datadict ${i} not found (4)]`);
						else {
							result += dict.fieldToString(ffield, data[i], elementType, style);
						}
					} else
						console.log(`[datadict ${i} not found (3)]`);

				} else { // if (!dictEntry)
				
					// display is false
					if (typeof dictEntry.display == 'boolean' && !dictEntry.display) {
						//console.log(`field ${i} has display = false. continuing...`);
						continue;
					}

					//console.log(`i ${i}, data[i] ${data[i]}, style ${style}, dictEntry.display.notShowIn ${dictEntry.display.notShowIn}`);
					if (dictEntry.display.notShowIn && !dictEntry.display.notShowIn.includes(style)) {
						let label = dictEntry.label;
						let value = data[i];

						//console.log('Does this field references a nested table?', label, value);
						//console.log(dictEntry.references);
						
						// field references a nested table
						if (dictEntry.references && dictEntry.references.nested) {
							// first let's find the correct dict
							dict = arkDataDictList.get(dictEntry.references.table);
							if (!dict)
								value = `[datadict ${dictEntry.references.table} not found (1)]`;
							else {
								value = '';
								data[i].forEach((subData) => {
									value += dict.rowToString(subData, elementType, style);
								});
							}
						} else if (dictEntry.references && !dictEntry.references.nested) {
							// field has references, but not nested
							//console.log('another table!', dictEntry.references.table);
							dict = arkDataDictList.get(dictEntry.references.table);
							if (!dict)
								value = `[datadict ${dictEntry.references.table} not found (2)]`;
							else
								value = '';
							dictEntry.references.foreignData.forEach((v) => {
								//value += data[`${dictEntry.references.table}_${v}`] + ' ';
								//console.log(v, `${dictEntry.references.table}_${v}`, data[`${dictEntry.references.table}_${v}`]);
								value += dict.fieldToString(v, data[`${dictEntry.references.table}_${v}`], elementType, style) + ' ';
							});
						}
						//console.log(`calling fieldToString(${i}, ${value}, ${elementType}, ${style})`);
						result += this.fieldToString(i, value, elementType, style);
					} else
						console.log(`style ${style} not allowed`);
				}
			}

		} catch(e) {
			let msg = 'A blue ogre writes:' + e;
			if (typeof window === 'undefined')
				console.log(msg);
			else
				alert(msg);
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
		try {
			if (!this.primaryKeyFields) {
				this.primaryKeyFields = new Array();
				this.fields.forEach((v, k) => {
					if (v.primaryKey)
						this.primaryKeyFields.push(k);
				});
			}
		} catch(e) {
			let msg = 'What\'s the chair\'s name? It\'s:' + e;
			if (typeof window === 'undefined')
				console.log(msg);
			else
				alert(msg);
		}
		console.log('this.primaryKeyFields', this.primaryKeyFields);
		
		return this.primaryKeyFields.filter((v) => { return data.hasOwnProperty(v); }).reduce((total, v) => { return total + (total.length > 0 ? '-' : '') + data[v]; }, '');
	}

	
	/*
	 * Filter given data (record), return only fields that match filter.
	 * Useful for pruning out extra data in input object before sending to database, or to separate data.
	 */
	filterRecord(record, filter = '!references', returnNotList = false) {
		let result = {}, resultNot = {};

		try {
			for (let i in record) {
				// check if field has a datadict definition
				if (this.fields.get(i)) {
					let passed;
					if (typeof filter == 'function') {
						passed = filter(record[i], this.fields.get(i));
					} else {
						switch(filter) {
						case '!references':
							passed = !this.fields.get(i).hasOwnProperty('references');
							break;
						default:
							passed = false;
						}
					}

					if (passed)
						result[i] = record[i];
					else if (returnNotList)
						resultNot[i] = record[i];
				} else
					// field has not a datadict definition (maybe a reference?)
					// shove it in resultNot array
					resultNot[i] = record[i];
			}
		} catch(e) {
			let msg = 'The flying rat drops a sword named:' + e;
			if (typeof window === 'undefined')
				console.log(msg);
			else
				alert(msg);
		}
			
		if (returnNotList)
			return [ result, resultNot ];
		else
			return result;
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
