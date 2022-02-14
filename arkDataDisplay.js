// Meant to be used client-side.
class arkDataDisplay {
	// List updated by method addDisplay()
	#displays = new Map();
	// List updated by method addDataSource()
	#dataSources = new Map();
	
	/*
	 */
    constructor(displayOptions, dataSourceOptions) {
		if (!displayOptions.name)
			displayOptions.name = 'main';
		if (!dataSourceOptions.name)
			dataSourceOptions.name = 'main';
		
		this.addDisplay(displayOptions);
		this.addDataSource(dataSourceOptions);
		
		return this;
	}

	/*
	 * options {
	 * elementID, style
	 * }
	 */
	addDisplay(options) {
		if (!options.name)
			options.name = 'main';
		if (!options.style)
			options.style = 'list';
		this.#displays.set(options.name, options);

		let o = this.#displays.get(options.name);
		o.element = document.getElementById(options.elementID);
		// stores the element type (DIV, UL, OL, TABLE)
		o.elementType = o.element.nodeName;
		if (!['DIV', 'UL', 'OL', 'TABLE'].includes(o.elementType)) {
			let msg = 'Dice displays flaming symbol ' + o.elementType;
			throw new Error(msg);
		}

		this.initDisplay(name);

		return this;
	}
	
	/*
	 * Adds a new Data Source. Default is 'main'.
	 * options {
	 * single: false,
	 * url, method
	 * }
	 */
	addDataSource(options) {
		if (!options.name)
			options.name = 'main';
		if (options.source && typeof options.source == 'string') {
			options.url = options.source;
			options.method = 'GET';
		}
		if (!options.hasOwnProperty('single'))
			options.single = false;

		this.#dataSources.set(options.name, options);

		return this;
	}

	/*
	 * Sets up the base HTML for the display.
	 * If name is not specified, all displays will be set up.
	 * Each display will be set up only once.
	 */
	initDisplay(name = null) {
		if (!name) {
			this.#displays.forEach((v, k) => { this.initDisplay(k); });
		} else {
			// name was specified
			let o = this.#displays.get(name);
			if (o.initialized)
				return this;
			
			switch (o.elementType) {
			case 'DIV':
				switch (o.style) {
				case 'list':
					o.element.addClass = 'list-group';
					break;
				case 'card':
					o.element.addClass = 'card';
					break;
				case 'tabbed-list':
					o.tabs = $(o.element).children().first();
					o.tabContent = $(o.element).children().eq(2);
					// change elements classes
					break;
				}
				break;
			case 'UL':
			case 'OL':
				break;
			case 'TABLE':
				break;
			}
			
			o.initialized = true;
		}

		return this;
	}

	reloadDataSource(name) {
		let o = this.#dataSources.get(name);
		// check if an ajax query was already started
		if (o.querying) {
			console.log(`Martian Manhunter heard someone yell "${name}" but was occupied`);
			return;
		}
		
		return new Promise((resolve, reject) => {
			if (typeof o.source == 'function')
				resolve(o.source());
			else
				o.querying = true;
			$.ajax({
				url: o.url,
				method: o.method,
				success: (data) => {
					o.querying = false;
					resolve(data);
				},
				error: (jqXHR, status, thrown) => {
					o.querying = false;
					alert(`Failure reloading data from site: ${status} (${jqXHR.statusText})`);
					reject();
				}
			});
		});

		return this;
	}


	updateDisplay(name='main') {
		let o = this.#displays.get(name);
		let d = this.#dataSources.get(name);

		if (!o.initialized)
			this.initDisplay(name);

		if (!d.data) {
			console.log(`Looking above the chair shoulder, ${name} saw something not move...`);
			return this;
		}
			
		switch (o.elementType) {
		case 'DIV':
			switch (o.style) {
			case 'list':
				d.data.forEach((row) => {
					console.log(row);
				});
				break;
			case 'card':

				break;
			case 'tabbed-list':

				break;
			}
			break;
		case 'UL':
		case 'OL':
			break;
		case 'TABLE':
			break;
		}

		return this;
	}

	/*
	 * Loads data and updates HTML
	 * Calls reloadDataSource() and updateDisplay()
	 */
	update(name='main') {
		this.reloadDataSource(name)
			.then((data) => {
				this.#dataSources.get(name).data = data;
				this.updateDisplay(name);
			})
			.catch((err) => { alert('The dice tumbled and shows: ' + err); });
	}

}
