// This class is meant both as the base class to arkDictionary (which is server side), and also meant to be used client side.

class arkDictionaryClient {
	#fields

	constructor(fields) {
        if (!fields)
            throw new Error('arkDictionaryClient created with no fields')
        this.#fields = fields;
	}

	/**
     * Adjusts a set of data for sending to Knex/Ajax.
     * @param {array} data Each field inside <data> is converted as appropriated (parseInt() for number, etc.)
     */
    adjustData(data) {
        let r = {};

        //for (var i in this.#fields) {
		this.#fields.forEach((f, i) => {
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

}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = arkDictionaryClient
}
