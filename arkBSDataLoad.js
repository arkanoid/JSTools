var _arkBSDataLoad = new Map();

class arkBSDataLoad {
	name;
	dataSource;
	elements = {};
	options;
	data;
	querying;
	selectedIndex;
	
	constructor(name, dataSource, options) {
		this.name = name;

		if (typeof dataSource == 'string')
			this.dataSource = {
				url: dataSource,
				method: 'GET'
			};
		else
			this.dataSource = dataSource;

		this.options = options;

		this.elements.main = document.getElementById(name);
		if (!this.elements.main)
			throw new Error(`arkBSDataLoad: no element with id="${name}" found`);
		//this.readBSElements();

		_arkBSDataLoad.set(name, this);

		return this;
	}


	/* Loads data and updates HTML
	 * Calls reloadDataSource() and updateDisplay()
	 */
	update() {
		this.reloadDataSource()
			.then((data) => {
				this.data = data;
				this.selectedIndex = null;
				this.updateDisplay();
			})
			.catch((err) => { alert('The dice tumbled and shows: ' + err); });
		return this;
	}

	/*
	 * Checks this.data (previously loaded and stored) and returns the record selected by the user.
	 */
	getRecord() {
		console.log(`${this.name} getRecord() ${this.selectedIndex}`);
		console.log(typeof this.selectedIndex);
		if (typeof this.selectedIndex == 'number')
			return this.data[ this.selectedIndex ];
	}

	updateDisplay() {
	}
	
	reloadDataSource() {
		// check if an ajax query was already started
		if (this.querying) {
			console.log(`Martian Manhunter heard someone yell "${this.name}" but was occupied`);
			return;
		}
		
		return new Promise((resolve, reject) => {
			if (typeof this.dataSource == 'function')
				resolve(this.dataSource());
			else
				this.querying = true;
			$.ajax({
				url: this.dataSource.url,
				method: this.dataSource.method,
				success: (data) => {
					this.querying = false;
					this.data = data;
					resolve(data);
				},
				error: (jqXHR, status, thrown) => {
					this.querying = false;
					alert(`Failure reloading data from site: ${status} (${jqXHR.statusText})`);
					reject(status);
				}
			});
		});
	}
}
